/**
 * Swipe-to-scroll detection.
 *
 * Swipe the index finger up and the page scrolls down; swipe down and it
 * scrolls up.
 *
 * The hard part is not detecting the swipe, it is ignoring the *return stroke*.
 * A long page needs many swipes, and every swipe has to travel back before the
 * next one. If the return counted, you would undo each swipe and go nowhere.
 * Two independent gates handle it:
 *
 *   1. Speed, with hysteresis. A swipe is a flick, not a drift. Motion has to
 *      exceed `engageSpeed` to take hold and only stops counting below
 *      `releaseSpeed`, so a deliberate stroke cannot flicker on and off. A
 *      relaxed return simply never crosses the line.
 *
 *   2. Pose. Only an extended index finger drives the page. Curl it and motion
 *      is ignored entirely -- the same idea as lifting a mouse off the pad,
 *      and the deliberate escape hatch when a fast return is needed.
 *
 * While a swipe is live the finger's speed drives scroll velocity directly, so
 * the page tracks your hand. On release the scroll engine's own friction takes
 * over and coasts, which is what makes one flick cover real distance.
 */
import type { HandMetrics } from './analysis';
import { OneEuroFilter } from './filters/one-euro';

export interface SwipeConfig {
  /** Finger speed (hand-widths/s) needed to start driving the page. */
  engageSpeed: number;
  /** Speed below which driving stops. Must be under engageSpeed. */
  releaseSpeed: number;
  /** Scroll velocity (px/s) per unit of finger speed (hand-widths/s). */
  gain: number;
  /** Require the pointing pose. Off = any hand motion scrolls. */
  requirePointPose: boolean;
  /** Flip the mapping (swipe up scrolls up). */
  invert: boolean;
  filterMinCutoff: number;
  filterBeta: number;
}

export const DEFAULT_SWIPE: SwipeConfig = {
  engageSpeed: 1.6,
  releaseSpeed: 0.7,
  gain: 420,
  requirePointPose: true,
  invert: false,
  filterMinCutoff: 1.0,
  filterBeta: 2.5,
};

export interface SwipeState {
  /** Filtered vertical finger speed, hand-widths/s. Negative = moving up. */
  speed: number;
  /** True while the finger is actively driving the page. */
  driving: boolean;
  /** Scroll velocity being requested this frame, px/s. */
  scrollVelocity: number;
  /** Why the gesture is not driving, for the HUD. */
  blockedBy: 'none' | 'pose' | 'speed' | 'no-hand';
}

const IDLE: SwipeState = {
  speed: 0,
  driving: false,
  scrollVelocity: 0,
  blockedBy: 'no-hand',
};

export class SwipeDetector {
  config: SwipeConfig;
  private tipY: OneEuroFilter;
  private lastY: number | null = null;
  private lastT: number | null = null;
  private speed = 0;
  private driving = false;

  constructor(config: Partial<SwipeConfig> = {}) {
    this.config = { ...DEFAULT_SWIPE, ...config };
    this.tipY = new OneEuroFilter(
      this.config.filterMinCutoff,
      this.config.filterBeta
    );
  }

  /** Call when the hand leaves the frame, so stale motion cannot resume. */
  reset(): SwipeState {
    this.tipY.reset();
    this.lastY = null;
    this.lastT = null;
    this.speed = 0;
    this.driving = false;
    return IDLE;
  }

  /**
   * Feed one tracked frame. Returns the requested scroll velocity, which the
   * caller hands to the scroll engine -- gestures are just another velocity
   * source, exactly like the wheel.
   */
  update(m: HandMetrics, t: number): SwipeState {
    const { engageSpeed, releaseSpeed, gain, requirePointPose, invert } =
      this.config;

    // Smooth the tip first, then differentiate. Differentiating raw landmarks
    // amplifies tracker jitter into phantom flicks.
    const y = this.tipY.filter(m.tip.y, t);

    if (this.lastY === null || this.lastT === null) {
      this.lastY = y;
      this.lastT = t;
      return { ...IDLE, blockedBy: 'speed' };
    }

    const dt = Math.max(1e-3, (t - this.lastT) / 1000);
    // Divided by hand size, so distance from the camera does not change feel.
    const raw = (y - this.lastY) / dt / m.handSize;
    this.lastY = y;
    this.lastT = t;

    // Light additional smoothing on the speed estimate itself.
    this.speed += (raw - this.speed) * 0.5;

    const poseOk = !requirePointPose || m.pose === 'point';
    const magnitude = Math.abs(this.speed);

    if (!poseOk) {
      this.driving = false;
    } else if (this.driving) {
      if (magnitude < releaseSpeed) this.driving = false;
    } else if (magnitude >= engageSpeed) {
      this.driving = true;
    }

    // Image y grows downward, so a finger moving up is negative. Swipe up
    // should scroll down, i.e. increase scroll offset -- hence the negation.
    const scrollVelocity = this.driving
      ? -this.speed * gain * (invert ? -1 : 1)
      : 0;

    return {
      speed: this.speed,
      driving: this.driving,
      scrollVelocity,
      blockedBy: this.driving ? 'none' : !poseOk ? 'pose' : 'speed',
    };
  }
}
