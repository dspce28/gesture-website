/**
 * Tap to click.
 *
 * Touch the index fingertip to the thumb once to click, twice to double-click
 * — the same mapping a mouse has.
 *
 * The first tap fires its click immediately rather than waiting to find out
 * whether a second one is coming. Waiting would put a few hundred milliseconds
 * of lag on every single click, which is exactly the delay that made early
 * touch browsers feel broken. Instead this follows what a real mouse does: the
 * second tap fires its own click and then a double-click on top, so a listener
 * for either event sees what it expects and nothing is held back.
 *
 * Thresholds form a Schmitt trigger — the pinch has to close well below where
 * it reopens — so a fingertip resting near the boundary cannot chatter out a
 * stream of taps. The numbers have real headroom: measured against a recording,
 * a hand pointing downward sits at a pinch ratio of 0.35-0.44, comfortably
 * clear of the 0.15 needed to register as closed.
 */

export interface TapConfig {
  /** Pinch ratio (thumb-index over hand size) below which the pinch is closed. */
  closeAt: number;
  /** Ratio above which it counts as open again. Must exceed closeAt. */
  openAt: number;
  /** Longest a tap may stay closed, ms. Longer is a hold, which zoom claims. */
  maxTapMs: number;
  /** Two taps within this window are a double-click, ms. */
  doubleGapMs: number;
  /**
   * How far back to take aim, ms. Fingers drift as they fold, so the position
   * at the moment of contact is not where the user was pointing when they
   * decided to click.
   */
  aimLookbackMs: number;
}

export const DEFAULT_TAP: TapConfig = {
  // 0.15 proved too tight to reach in practice. The ratio divides by hand size
  // (wrist to middle knuckle), so how low a full fingertip touch can go depends
  // on hand proportions and camera distance — it does not reliably approach
  // zero. 0.20 is easier to hit while still clearing the 0.35-0.44 that a hand
  // measures while scrolling, so scrolling still cannot click by accident.
  // The bar shows the lowest pinch seen, so this can be set from measurement.
  closeAt: 0.2,
  openAt: 0.32,
  maxTapMs: 320,
  doubleGapMs: 400,
  aimLookbackMs: 180,
};

export interface TapState {
  /** Current pinch ratio, for the HUD. */
  pinch: number;
  closed: boolean;
  /**
   * Set on the frame a click fires: 1 for a click, 2 for the second tap of a
   * double-click (which fires a click *and* a double-click). 0 otherwise.
   */
  fired: 0 | 1 | 2;
}

export class TapDetector {
  config: TapConfig;
  private closed = false;
  private closedAt = 0;
  private lastTapAt = 0;

  constructor(config: Partial<TapConfig> = {}) {
    this.config = { ...DEFAULT_TAP, ...config };
  }

  reset() {
    this.closed = false;
    this.closedAt = 0;
    this.lastTapAt = 0;
  }

  /** Feed one frame's pinch ratio. */
  update(pinch: number, t: number): TapState {
    const { closeAt, openAt, maxTapMs, doubleGapMs } = this.config;
    let fired: 0 | 1 | 2 = 0;

    if (!this.closed && pinch < closeAt) {
      this.closed = true;
      this.closedAt = t;
    } else if (this.closed && pinch > openAt) {
      this.closed = false;

      // A brief close-and-open is a tap. A long one is a hold, and that
      // gesture belongs to zoom, so it must not produce a click here.
      if (t - this.closedAt <= maxTapMs) {
        if (this.lastTapAt && t - this.lastTapAt <= doubleGapMs) {
          fired = 2;
          // Cleared so a third tap starts a fresh pair rather than firing a
          // second double-click off the back of the same one.
          this.lastTapAt = 0;
        } else {
          fired = 1;
          this.lastTapAt = t;
        }
      }
    }

    return { pinch, closed: this.closed, fired };
  }
}
