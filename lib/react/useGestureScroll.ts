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
import { DEFAULT_FLICK, FlickDetector, type FlickConfig, type FlickState } from '../gesture/flick';
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

const IDLE_TAP: TapState = { pinch: 1, closed: false, fired: 0 };

const IDLE_FLICK: FlickState = {
  speedY: 0,
  speedX: 0,
  fired: 0,
  cooling: false,
  blockedBy: 'no-hand',
};

export function useGestureScroll(
  controllerRef: React.RefObject<ScrollController | null>
) {
  const [status, setStatus] = useState<GestureStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<PointingConfig>({ ...DEFAULT_POINTING });
  const [flickConfig, setFlickConfig] = useState<FlickConfig>({ ...DEFAULT_FLICK });

  const sessionRef = useRef<GestureSession | null>(null);
  const detectorRef = useRef<PointingDetector | null>(null);
  const tapRef = useRef<TapDetector | null>(null);
  const flickRef = useRef<FlickDetector | null>(null);
  const pointerRef = useRef<PointerTracker | null>(null);

  // Live values, polled by the HUD and cursor. Never rendered directly.
  const landmarksRef = useRef<Landmark[] | null>(null);
  const pointRef = useRef<PointingState>(IDLE_POINTING);
  const tapStateRef = useRef<TapState>(IDLE_TAP);
  const flickStateRef = useRef<FlickState>(IDLE_FLICK);
  const statsRef = useRef<SessionStats | null>(null);
  const aimingRef = useRef(false);
  /** 0 = open hand, 1 = fully pinched. Drives the cursor's squeeze. */
  const pinchProgressRef = useRef(0);

  useEffect(() => {
    if (detectorRef.current) Object.assign(detectorRef.current.config, config);
  }, [config]);

  useEffect(() => {
    if (flickRef.current) Object.assign(flickRef.current.config, flickConfig);
  }, [flickConfig]);

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
    flickRef.current = null;
    pointerRef.current = null;
    landmarksRef.current = null;
    pointRef.current = IDLE_POINTING;
    tapStateRef.current = IDLE_TAP;
    flickStateRef.current = IDLE_FLICK;
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
    const flick = new FlickDetector(flickConfig);
    const pointer = new PointerTracker(window.innerWidth, window.innerHeight);
    detectorRef.current = detector;
    tapRef.current = tap;
    flickRef.current = flick;
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
          flickStateRef.current = flick.reset();
          tap.reset();
          pointer.release();
          tapStateRef.current = IDLE_TAP;
          aimingRef.current = false;
          pinchProgressRef.current = 0;
          return;
        }

        const m = analyze(frame.landmarks);
        pointRef.current = detector.update(m, frame.t);

        // One quick vertical flick pages the view. scrollTo animates it with
        // the engine's spring, so the jump is smooth and always lands exactly
        // one page away rather than wherever momentum happened to run out.
        const flickState = flick.update(m, frame.t);
        flickStateRef.current = flickState;

        if (flickState.fired !== 0) {
          const controller = controllerRef.current;
          if (controller) {
            const page = window.innerHeight * flick.config.pageFraction;
            controller.scrollTo(controller.physics.position + flickState.fired * page);
          }
        }

        // The cursor now tracks the finger the whole time rather than being
        // parked by a scroll pose. Speed alone separates the two intents: slow
        // movement aims, a fast vertical snap pages. That removes the clutch
        // and the mode switch with it.
        aimingRef.current = true;

        pointer.update(
          m.tip,
          m.handSize,
          frame.t,
          true,
          window.innerWidth,
          window.innerHeight
        );

        const tapState = tap.update(m.pinch, frame.t);
        tapStateRef.current = tapState;
        pinchProgressRef.current = Math.min(
          1,
          Math.max(0, 1 - (m.pinch - tap.config.closeAt) / (0.6 - tap.config.closeAt))
        );

        if (tapState.fired !== 0) {
          // Aim from before the fingers folded: they drift while closing.
          const aim = pointer.aimAt(tap.config.aimLookbackMs, frame.t);
          const landed = clickAt(aim.x, aim.y, tapState.fired);
          ripple(landed.x, landed.y, tapState.fired === 2);
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
    flickConfig,
    setFlickConfig,
    flickStateRef,
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
