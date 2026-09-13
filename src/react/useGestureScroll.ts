/**
 * Wires the vision pipeline to the scroll engine.
 *
 * This is the whole point of the phase ordering: the gesture layer does not
 * implement scrolling. It measures a hand and hands a velocity to the same
 * engine the wheel already drives. If wheel scrolling feels right, this does
 * too, because it is the identical code path downstream of one number.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { analyze } from '../gesture/analysis';
import { GestureSession, type SessionStats } from '../gesture/session';
import { DEFAULT_SWIPE, SwipeDetector, type SwipeConfig, type SwipeState } from '../gesture/swipe';
import type { Landmark } from '../gesture/types';
import type { ScrollController } from '../scroll/controller';

export type GestureStatus = 'idle' | 'starting' | 'running' | 'error';

const IDLE_SWIPE: SwipeState = {
  speed: 0,
  driving: false,
  scrollVelocity: 0,
  blockedBy: 'no-hand',
};

export function useGestureScroll(
  controllerRef: React.RefObject<ScrollController | null>
) {
  const [status, setStatus] = useState<GestureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [swipe, setSwipe] = useState<SwipeState>(IDLE_SWIPE);
  const [config, setConfig] = useState<SwipeConfig>({ ...DEFAULT_SWIPE });

  const sessionRef = useRef<GestureSession | null>(null);
  const detectorRef = useRef<SwipeDetector | null>(null);
  /** Landmarks live in a ref: 30 renders a second for canvas painting is waste. */
  const landmarksRef = useRef<Landmark[] | null>(null);

  // Push knob changes into the live detector without recreating it, so tuning
  // never interrupts an in-flight gesture.
  useEffect(() => {
    if (detectorRef.current) Object.assign(detectorRef.current.config, config);
  }, [config]);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    detectorRef.current = null;
    landmarksRef.current = null;
    setStatus('idle');
    setSwipe(IDLE_SWIPE);
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setStatus('starting');
    setError(null);

    const detector = new SwipeDetector(config);
    detectorRef.current = detector;

    const session = new GestureSession({
      targetFps: 30,
      onReady: (s) => {
        setStats(s);
        setStatus('running');
      },
      onFrame: (frame, s) => {
        setStats(s);
        landmarksRef.current = frame.landmarks;

        if (!frame.landmarks) {
          setSwipe(detector.reset());
          return;
        }

        const metrics = analyze(frame.landmarks);
        const next = detector.update(metrics, frame.t);
        setSwipe(next);

        // Only write while actually swiping. Zeroing on release would kill the
        // coast, and the coast is what makes one flick cover real distance.
        if (next.driving) controllerRef.current?.physics.drive(next.scrollVelocity);
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
    stats,
    swipe,
    config,
    setConfig,
    landmarksRef,
    start,
    stop,
  };
}
