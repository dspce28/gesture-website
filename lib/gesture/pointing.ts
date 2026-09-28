/**
 * Scroll by pointing.
 *
 * Point the index finger up and the page scrolls up; point it down and it
 * scrolls down. The direction is *held*, and the page keeps moving while you
 * hold it -- a joystick, not a flick.
 *
 * This replaced a swipe/flick detector after watching a recording of how the
 * gesture is actually performed. Two things settled it:
 *
 *   Holding beats flicking. Each direction was held steady for one to two
 *   seconds at a time, with the hand barely translating. A velocity detector
 *   sees only the brief transition between poses and nothing during the hold,
 *   so the page moved in sporadic jerks and then stopped.
 *
 *   Holding also dissolves the return-stroke problem entirely. There is no
 *   return stroke: you do not swipe back, you just stop pointing. The two gates
 *   the flick detector needed to ignore return strokes are simply gone.
 *
 * The signal is the sine of the index finger's angle, which separates far more
 * cleanly than finger velocity ever did: +0.87..+0.94 pointing up, -0.18..-0.57
 * pointing down, measured off a real session.
 */
import type { HandMetrics } from './analysis';
import { OneEuroFilter } from './filters/one-euro';

export interface PointingConfig {
  /**
   * Elevation treated as the centre of the dead band. Not zero: a relaxed
   * "down" point sits around -0.4 and "up" around +0.9, so the midpoint of a
   * natural range is above horizontal.
   */
  neutral: number;
  /** Half-width of the dead band around neutral. */
  deadzone: number;
  /** px/s of scroll per unit of deflection past the dead band. */
  gain: number;
  /** Ceiling on requested scroll speed, px/s. */
  maxSpeed: number;
  /** Point up scrolls down instead of up. */
  invert: boolean;
  /** Require middle, ring and pinky curled. The reliable "in pose" test. */
  requireCurledFingers: boolean;
  /**
   * Minimum index length over hand size. Below this the finger is pointing
   * nearly straight at the camera and its projected angle means little.
   */
  minIndexLength: number;
  filterMinCutoff: number;
  filterBeta: number;
}

export const DEFAULT_POINTING: PointingConfig = {
  neutral: 0.25,
  deadzone: 0.2,
  gain: 2200,
  maxSpeed: 2600,
  invert: false,
  requireCurledFingers: true,
  minIndexLength: 0.3,
  filterMinCutoff: 1.2,
  filterBeta: 1.5,
};

export type PointingDirection = 'up' | 'down' | 'neutral';

export interface PointingState {
  /** Smoothed elevation, -1..1. */
  elevation: number;
  /** Same value as an angle above horizontal, for display. */
  degrees: number;
  direction: PointingDirection;
  /** Scroll velocity requested this frame, px/s. */
  scrollVelocity: number;
  blockedBy: 'none' | 'pose' | 'neutral' | 'no-hand';
}

const IDLE: PointingState = {
  elevation: 0,
  degrees: 0,
  direction: 'neutral',
  scrollVelocity: 0,
  blockedBy: 'no-hand',
};

export class PointingDetector {
  config: PointingConfig;
  private elev: OneEuroFilter;

  constructor(config: Partial<PointingConfig> = {}) {
    this.config = { ...DEFAULT_POINTING, ...config };
    this.elev = new OneEuroFilter(
      this.config.filterMinCutoff,
      this.config.filterBeta
    );
  }

  /** Call when the hand leaves frame so a stale angle cannot keep scrolling. */
  reset(): PointingState {
    this.elev.reset();
    return IDLE;
  }

  update(m: HandMetrics, t: number): PointingState {
    const {
      neutral, deadzone, gain, maxSpeed, invert,
      requireCurledFingers, minIndexLength,
    } = this.config;

    const elevation = this.elev.filter(m.elevation, t);
    const degrees = (Math.asin(Math.max(-1, Math.min(1, elevation))) * 180) / Math.PI;

    const poseOk =
      (!requireCurledFingers || m.othersCurled) && m.indexLength >= minIndexLength;

    if (!poseOk) {
      return { elevation, degrees, direction: 'neutral', scrollVelocity: 0, blockedBy: 'pose' };
    }

    // Deflection from the centre of the dead band, with the band subtracted so
    // speed ramps from zero at the edge rather than jumping.
    const signal = elevation - neutral;
    const past = Math.abs(signal) - deadzone;

    if (past <= 0) {
      return { elevation, degrees, direction: 'neutral', scrollVelocity: 0, blockedBy: 'neutral' };
    }

    const up = signal > 0;
    // Pointing up scrolls toward the top of the page, i.e. a decreasing offset.
    const sign = (up ? -1 : 1) * (invert ? -1 : 1);
    const scrollVelocity = sign * Math.min(past * gain, maxSpeed);

    return {
      elevation,
      degrees,
      direction: up ? 'up' : 'down',
      scrollVelocity,
      blockedBy: 'none',
    };
  }
}
