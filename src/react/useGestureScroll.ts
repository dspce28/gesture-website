/**
 * Wires the vision pipeline to the scroll engine.
 *
 * This is the point of the phase ordering: the gesture layer does not implement
 * scrolling. It measures a hand and hands a velocity to the same engine the
 * wheel already drives, so if wheel scrolling feels right, this does too.
 *
 * Live telemetry goes into refs, never React state. Calling setState on every
 * tracked frame re-renders the whole tree tens of times a second, and that work
 * lands on the exact thread whose frame rate the architecture exists to
 * protect. HUDs read these refs from their own rAF loop instead. Only discrete,
 * low-frequency facts -- status, error text -- are React state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { analyze } from '../gesture/analysis';
import { GestureSession, type SessionStats } from '../gesture/session';
import {
  DEFAULT_POINTING,
  PointingDetector,
  type PointingConfig,
  type PointingState,
} from '../gesture/pointing';
import type { Landmark } from '../gesture/types';
import type { ScrollController } from '../scroll/controller';

export type GestureStatus = 'idle' | 'starting' | 'running' | 'error';

const IDLE_POINTING: PointingState = {
  elevation: 0,
  degrees: 0,
  direction: 'neutral' as const,
  scrollVelocity: 0,
  blockedBy: 'no-hand' as const,
};

export function useGestureScroll(
  controllerRef: React.RefObject<ScrollController | null>
) {
  const [status, setStatus] = useState<GestureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PointingConfig>({ ...DEFAULT_POINTING });

  const sessionRef = useRef<GestureSession | null>(null);
  const detectorRef = useRef<PointingDetector | null>(null);

  // Live values, polled by HUDs. Never rendered directly.
  const landmarksRef = useRef<Landmark[] | null>(null);
  const pointRef = useRef<PointingState>(IDLE_POINTING);
  const statsRef = useRef<SessionStats | null>(null);

  // Knob changes reach the live detector without recreating it, so tuning
  // never interrupts an in-flight gesture.
  useEffect(() => {
    if (detectorRef.current) Object.assign(detectorRef.current.config, config);
  }, [config]);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    detectorRef.current = null;
    landmarksRef.current = null;
    pointRef.current = IDLE_POINTING;
    statsRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setStatus('starting');
    setError(null);

    const detector = new PointingDetector(config);
    detectorRef.current = detector;

    const session = new GestureSession({
      targetFps: 30,
      onReady: (s) => {
        statsRef.current = s;
        setStatus('running');
      },
      onFrame: (frame, s) => {
        statsRef.current = s;
        landmarksRef.current = frame.landmarks;

        if (!frame.landmarks) {
          pointRef.current = detector.reset();
          return;
        }

        const metrics = analyze(frame.landmarks);
        const next = detector.update(metrics, frame.t);
        pointRef.current = next;

        // Drive only while a direction is actually being pointed. Writing zero
        // in the neutral band would hard-stop the page; leaving it alone lets
        // the engine's friction glide to rest, which reads as deceleration
        // rather than a stall.
        if (next.direction !== 'neutral') {
          controllerRef.current?.physics.drive(next.scrollVelocity);
        }
      },
      onError: (message, fatal) => {
        setError(message);
        if (fatal) setStatus('error');
      },
    });

    sessionRef.current = session;
    await session.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controllerRef]);

  return {
    status,
    error,
    config,
    setConfig,
    landmarksRef,
    pointRef,
    statsRef,
    start,
    stop,
  };
}
