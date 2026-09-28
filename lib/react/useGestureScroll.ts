'use client';

/**
 * Wires the vision pipeline to the scroll engine, the cursor and clicks.
 *
 * The gesture layer implements none of those things. It measures a hand and
 * hands a velocity to the same engine the wheel drives, a position to the
 * cursor, and a click to the DOM layer.
 *
 * Live telemetry goes into refs, never React state. Calling setState on every
 * tracked frame re-renders the whole tree tens of times a second, and that work
 * lands on the exact thread whose frame rate this architecture exists to
 * protect. HUDs read these refs from their own paint loop instead. Only
 * discrete, low-frequency facts -- status, error text -- are React state.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { analyze } from '../gesture/analysis';
import {
  DEFAULT_POINTING,
  PointingDetector,
  type PointingConfig,
  type PointingState,
} from '../gesture/pointing';
import { PointerTracker } from '../gesture/pointer';
import { TapDetector, type TapState } from '../gesture/tap';
import { GestureSession, type SessionStats } from '../gesture/session';
import type { Landmark } from '../gesture/types';
import type { ScrollController } from '../scroll/controller';
import { clickAt, ripple } from '../dom/click';

export type GestureStatus = 'idle' | 'starting' | 'running' | 'error';

const IDLE_POINTING: PointingState = {
  elevation: 0,
  degrees: 0,
  direction: 'neutral',
  scrollVelocity: 0,
  blockedBy: 'no-hand',
};

const IDLE_TAP: TapState = { pinch: 1, closed: false, pending: 0, clicked: false };

export function useGestureScroll(
  controllerRef: React.RefObject<ScrollController | null>
) {
  const [status, setStatus] = useState<GestureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PointingConfig>({ ...DEFAULT_POINTING });

  const sessionRef = useRef<GestureSession | null>(null);
  const detectorRef = useRef<PointingDetector | null>(null);
  const tapRef = useRef<TapDetector | null>(null);
  const pointerRef = useRef<PointerTracker | null>(null);

  // Live values, polled by the HUD and cursor. Never rendered directly.
  const landmarksRef = useRef<Landmark[] | null>(null);
  const pointRef = useRef<PointingState>(IDLE_POINTING);
  const tapStateRef = useRef<TapState>(IDLE_TAP);
  const statsRef = useRef<SessionStats | null>(null);
  const aimingRef = useRef(false);
  /** 0 = open hand, 1 = fully pinched. Drives the cursor's squeeze. */
  const pinchProgressRef = useRef(0);

  useEffect(() => {
    if (detectorRef.current) Object.assign(detectorRef.current.config, config);
  }, [config]);

  // Ease the cursor on the render clock, independent of the tracking rate, so
  // it stays smooth between inference frames.
  useEffect(() => {
    if (status !== 'running') return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (t - last) / 1000) || 0.016;
      last = t;
      pointerRef.current?.step(dt, t);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    detectorRef.current = null;
    tapRef.current = null;
    pointerRef.current = null;
    landmarksRef.current = null;
    pointRef.current = IDLE_POINTING;
    tapStateRef.current = IDLE_TAP;
    statsRef.current = null;
    aimingRef.current = false;
    setStatus('idle');
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    if (sessionRef.current) return;
    setStatus('starting');
    setError(null);

    const detector = new PointingDetector(config);
    const tap = new TapDetector();
    const pointer = new PointerTracker(window.innerWidth, window.innerHeight);
    detectorRef.current = detector;
    tapRef.current = tap;
    pointerRef.current = pointer;

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
          tap.reset();
          pointer.release();
          tapStateRef.current = IDLE_TAP;
          aimingRef.current = false;
          pinchProgressRef.current = 0;
          return;
        }

        const m = analyze(frame.landmarks);
        const next = detector.update(m, frame.t);
        pointRef.current = next;

        // Drive only while a direction is actually pointed. Writing zero in the
        // neutral band would hard-stop the page; leaving it alone lets the
        // engine's friction glide to rest, which reads as deceleration.
        if (next.direction !== 'neutral') {
          controllerRef.current?.physics.drive(next.scrollVelocity);
        }

        // The scroll dead band doubles as the cursor's clutch: level finger
        // aims, tilted finger scrolls with the cursor parked.
        const aiming = next.blockedBy === 'neutral';
        aimingRef.current = aiming;

        pointer.update(
          m.tip,
          m.handSize,
          frame.t,
          aiming,
          window.innerWidth,
          window.innerHeight
        );

        const tapState = tap.update(m.pinch, frame.t);
        tapStateRef.current = tapState;
        pinchProgressRef.current = Math.min(
          1,
          Math.max(0, 1 - (m.pinch - tap.config.closeAt) / (0.6 - tap.config.closeAt))
        );

        if (tapState.clicked) {
          // Aim from before the fingers folded: they drift while closing.
          const aim = pointer.aimAt(tap.config.aimLookbackMs, frame.t);
          const landed = clickAt(aim.x, aim.y);
          ripple(landed.x, landed.y);
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
    tapStateRef,
    statsRef,
    pointerRef,
    aimingRef,
    pinchProgressRef,
    start,
    stop,
  };
}
