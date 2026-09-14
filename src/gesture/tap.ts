/**
 * Double-tap to click.
 *
 * Touch the index fingertip to the thumb twice in quick succession. A single
 * tap deliberately does nothing: the hand passes through near-pinched shapes
 * constantly while gesturing, and a single-tap click misfires on all of them.
 * Requiring two in a row costs the user almost nothing and removes that whole
 * class of false positive.
 *
 * Thresholds are a Schmitt trigger -- close far below where it reopens -- so a
 * fingertip hovering at the boundary cannot chatter out a stream of taps. The
 * numbers have real headroom: measured against a recording, a hand pointing
 * downward sits at a pinch ratio of 0.35-0.44, well clear of the 0.15 needed to
 * register as closed.
 */

export interface TapConfig {
  /** Pinch ratio (thumb-index over hand size) below which the pinch is closed. */
  closeAt: number;
  /** Ratio above which it counts as open again. Must exceed closeAt. */
  openAt: number;
  /** Longest a single tap may stay closed, ms. Longer is a hold, not a tap. */
  maxTapMs: number;
  /** Longest gap between the two taps of a double-tap, ms. */
  doubleGapMs: number;
  /** Ignore further clicks for this long after one fires, ms. */
  cooldownMs: number;
  /**
   * How far back to take aim, ms. Fingers drift as they fold, so the position
   * at the moment of contact is not where the user was pointing when they
   * decided to click.
   */
  aimLookbackMs: number;
}

export const DEFAULT_TAP: TapConfig = {
  closeAt: 0.15,
  openAt: 0.28,
  maxTapMs: 320,
  doubleGapMs: 420,
  cooldownMs: 500,
  aimLookbackMs: 180,
};

export interface TapState {
  /** Current pinch ratio, for the HUD. */
  pinch: number;
  closed: boolean;
  /** Taps banked toward a double-tap (0 or 1). */
  pending: number;
  /** Set on the frame a click fires, otherwise null. */
  clicked: boolean;
}

export class TapDetector {
  config: TapConfig;
  private closed = false;
  private closedAt = 0;
  private lastTapAt = 0;
  private pending = 0;
  private lastClickAt = 0;

  constructor(config: Partial<TapConfig> = {}) {
    this.config = { ...DEFAULT_TAP, ...config };
  }

  reset() {
    this.closed = false;
    this.pending = 0;
    this.closedAt = 0;
    this.lastTapAt = 0;
  }

  /** Feed one frame's pinch ratio. Returns whether a click fired this frame. */
  update(pinch: number, t: number): TapState {
    const { closeAt, openAt, maxTapMs, doubleGapMs, cooldownMs } = this.config;
    let clicked = false;

    // Expire a lone first tap that was never followed up.
    if (this.pending === 1 && t - this.lastTapAt > doubleGapMs) this.pending = 0;

    if (!this.closed && pinch < closeAt) {
      this.closed = true;
      this.closedAt = t;
    } else if (this.closed && pinch > openAt) {
      this.closed = false;
      const heldFor = t - this.closedAt;

      // A brief close-and-open is a tap. A long one is a hold -- that gesture
      // belongs to zoom, so it must not bank a tap here.
      if (heldFor <= maxTapMs) {
        if (this.pending === 1 && t - this.lastTapAt <= doubleGapMs) {
          this.pending = 0;
          if (t - this.lastClickAt > cooldownMs) {
            clicked = true;
            this.lastClickAt = t;
          }
        } else {
          this.pending = 1;
          this.lastTapAt = t;
        }
      }
    }

    return { pinch, closed: this.closed, pending: this.pending, clicked };
  }
}
