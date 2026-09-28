/**
 * Flick to page.
 *
 * One quick vertical movement of the finger scrolls one page. Not a continuous
 * drag and not momentum: a discrete, bounded jump, animated by the scroll
 * engine's spring. That makes the result predictable — you always know exactly
 * where a flick lands — and smooth by construction, because the engine is
 * interpolating between two fixed positions rather than chasing a hand.
 *
 * Three gates keep it from firing when you did not mean it:
 *
 *   Speed. A flick is a deliberate snap, not a drift. Below `minSpeed`
 *   nothing happens, which is most of what a hand does while aiming.
 *
 *   Vertical dominance. Reaching across the screen for a link is also a fast
 *   movement, and without this it would page the view every time you went to
 *   click something. Requiring the motion to be mostly up/down means sideways
 *   travel never scrolls.
 *
 *   A refractory period. After a flick fires, further flicks are ignored for a
 *   moment. This is what absorbs the return stroke — the hand has to travel
 *   back before the next flick, and that return is exactly the gesture in
 *   reverse. Rather than trying to tell the two apart, we simply stop
 *   listening until it is over.
 */
import type { HandMetrics } from './analysis';
import { OneEuroFilter } from './filters/one-euro';

export interface FlickConfig {
  /** Finger speed (hand-widths/s) needed to register a flick. */
  minSpeed: number;
  /**
   * How much more vertical than horizontal the motion must be. 1 accepts a
   * 45° diagonal; higher demands a straighter up/down flick.
   */
  verticalBias: number;
  /** Ignore further flicks for this long after one fires, ms. */
  refractoryMs: number;
  /** Fraction of the viewport a single flick travels. */
  pageFraction: number;
  /** Flick up pages down, matching a touchscreen swipe. */
  invert: boolean;
  /** Require the pointing pose (other fingers curled). */
  requireCurledFingers: boolean;
  filterMinCutoff: number;
  filterBeta: number;
}

export const DEFAULT_FLICK: FlickConfig = {
  minSpeed: 2.2,
  verticalBias: 1.5,
  refractoryMs: 450,
  // Not a full viewport: a couple of lines carrying over keeps your place in
  // a paragraph, which is why page-down keys have always overlapped slightly.
  pageFraction: 0.9,
  invert: false,
  requireCurledFingers: true,
  filterMinCutoff: 1.2,
  filterBeta: 2.0,
};

export interface FlickState {
  /** Smoothed vertical finger speed, hand-widths/s. Negative = moving up. */
  speedY: number;
  /** Smoothed horizontal speed, for the dominance test. */
  speedX: number;
  /** +1 page down, -1 page up, 0 for none. Set only on the frame it fires. */
  fired: -1 | 0 | 1;
  /** True while flicks are being ignored after a recent one. */
  cooling: boolean;
  blockedBy: 'none' | 'pose' | 'slow' | 'sideways' | 'cooling' | 'no-hand';
}

const IDLE: FlickState = {
  speedY: 0,
  speedX: 0,
  fired: 0,
  cooling: false,
  blockedBy: 'no-hand',
};

export class FlickDetector {
  config: FlickConfig;
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private lastX: number | null = null;
  private lastY: number | null = null;
  private lastT: number | null = null;
  private speedX = 0;
  private speedY = 0;
  private firedAt = 0;

  constructor(config: Partial<FlickConfig> = {}) {
    this.config = { ...DEFAULT_FLICK, ...config };
    this.fx = new OneEuroFilter(this.config.filterMinCutoff, this.config.filterBeta);
    this.fy = new OneEuroFilter(this.config.filterMinCutoff, this.config.filterBeta);
  }

  reset(): FlickState {
    this.fx.reset();
    this.fy.reset();
    this.lastX = null;
    this.lastY = null;
    this.lastT = null;
    this.speedX = 0;
    this.speedY = 0;
    return IDLE;
  }

  update(m: HandMetrics, t: number): FlickState {
    const {
      minSpeed, verticalBias, refractoryMs, invert, requireCurledFingers,
    } = this.config;

    // Smooth the tip before differentiating: differentiating raw landmarks
    // turns tracker jitter into phantom flicks.
    const x = this.fx.filter(m.tip.x, t);
    const y = this.fy.filter(m.tip.y, t);

    if (this.lastX === null || this.lastY === null || this.lastT === null) {
      this.lastX = x;
      this.lastY = y;
      this.lastT = t;
      return { ...IDLE, blockedBy: 'slow' };
    }

    const dt = Math.max(1e-3, (t - this.lastT) / 1000);
    const scale = m.handSize || 0.1;
    const rawX = (x - this.lastX) / dt / scale;
    const rawY = (y - this.lastY) / dt / scale;
    this.lastX = x;
    this.lastY = y;
    this.lastT = t;

    this.speedX += (rawX - this.speedX) * 0.5;
    this.speedY += (rawY - this.speedY) * 0.5;

    const base = { speedX: this.speedX, speedY: this.speedY, fired: 0 as const };
    const cooling = t - this.firedAt < refractoryMs;

    if (requireCurledFingers && !m.othersCurled) {
      return { ...base, cooling, blockedBy: 'pose' };
    }
    if (cooling) {
      return { ...base, cooling: true, blockedBy: 'cooling' };
    }

    const mag = Math.abs(this.speedY);
    if (mag < minSpeed) {
      return { ...base, cooling: false, blockedBy: 'slow' };
    }
    if (mag < Math.abs(this.speedX) * verticalBias) {
      return { ...base, cooling: false, blockedBy: 'sideways' };
    }

    this.firedAt = t;
    // Image y grows downward, so a finger moving up is negative. Flicking up
    // pages down, the way a touchscreen swipe moves content under your finger.
    const down = this.speedY < 0;
    const dir = (down ? 1 : -1) * (invert ? -1 : 1);

    // Clear the speed estimate so the tail of this same flick cannot be read
    // as the start of another once the refractory period lapses.
    this.speedX = 0;
    this.speedY = 0;

    return {
      speedX: 0,
      speedY: 0,
      fired: dir as -1 | 1,
      cooling: true,
      blockedBy: 'none',
    };
  }
}
