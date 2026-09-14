/**
 * Cursor control from the index fingertip.
 *
 * Motion is relative, like a touchpad rather than a laser pointer: the cursor
 * moves by how far your finger moved, not to wherever it happens to be aimed.
 * Absolute mapping sounds more natural and is worse in practice -- it forces
 * the hand to physically reach the edges of a mapped box, and every tremor
 * lands directly on the target.
 *
 * Relative motion needs a clutch, the equivalent of lifting a mouse off the
 * pad. The scroll dead band is that clutch and costs no extra gesture: point up
 * or down and you are scrolling with the cursor parked, hold the finger level
 * and you are aiming. One posture, two modes, nothing to learn.
 *
 * Kept free of DOM references so the browser extension can reuse it. Anything
 * that needs to know what is under the cursor -- snapping to a button,
 * dispatching the click -- lives in the layer above.
 */

export interface PointerConfig {
  /** Screen widths travelled per hand-width of finger movement. */
  sensitivity: number;
  /** Finger travel per frame (in hand widths) below which nothing moves. */
  deadzone: number;
  /** Acceleration bounds: slow finger for precision, fast to cross the screen. */
  accelMin: number;
  accelMax: number;
  /** Position smoothing, 0..1 per frame at 60fps. Higher is snappier. */
  ease: number;
  /** How long to keep position history for aim lookback, ms. */
  historyMs: number;
}

export const DEFAULT_POINTER: PointerConfig = {
  sensitivity: 2.4,
  deadzone: 0.004,
  accelMin: 0.4,
  accelMax: 2.6,
  ease: 0.35,
  historyMs: 600,
};

export interface PointerSample {
  t: number;
  x: number;
  y: number;
}

export class PointerTracker {
  config: PointerConfig;
  /** Target position in viewport pixels. */
  target = { x: 0, y: 0 };
  /** Smoothed position actually shown. */
  position = { x: 0, y: 0 };

  private lastTip: { x: number; y: number } | null = null;
  private lastT: number | null = null;
  private history: PointerSample[] = [];

  constructor(width: number, height: number, config: Partial<PointerConfig> = {}) {
    this.config = { ...DEFAULT_POINTER, ...config };
    this.target = { x: width / 2, y: height / 2 };
    this.position = { ...this.target };
  }

  /** Drop motion state so a returning hand does not teleport the cursor. */
  release() {
    this.lastTip = null;
    this.lastT = null;
  }

  reset() {
    this.release();
    this.history = [];
  }

  /**
   * Advance the target from a new fingertip reading.
   * `active` false still tracks the finger but leaves the cursor parked, which
   * is what makes the scroll poses act as a clutch.
   */
  update(
    tip: { x: number; y: number },
    handSize: number,
    t: number,
    active: boolean,
    width: number,
    height: number
  ) {
    const { sensitivity, deadzone, accelMin, accelMax } = this.config;

    if (this.lastTip !== null && this.lastT !== null && active) {
      const dx = tip.x - this.lastTip.x;
      const dy = tip.y - this.lastTip.y;
      const travel = Math.hypot(dx, dy) / (handSize || 0.1);

      if (travel > deadzone) {
        const dt = Math.max(1e-3, (t - this.lastT) / 1000);
        const speed = travel / dt;
        const accel = Math.min(accelMax, Math.max(accelMin, 0.35 + speed * 0.9));
        const gain = sensitivity * accel;

        // The camera is not mirrored, so a hand moving right appears to move
        // left. Negate x so the cursor follows the hand as the user sees it.
        this.target.x = clamp(this.target.x - dx * width * gain, 0, width);
        this.target.y = clamp(this.target.y + dy * height * gain, 0, height);
      }
    }

    this.lastTip = { x: tip.x, y: tip.y };
    this.lastT = t;
  }

  /** Ease the shown position toward the target. Call once per rendered frame. */
  step(dt: number, t: number) {
    const k = 1 - Math.pow(1 - this.config.ease, dt * 60);
    const dx = this.target.x - this.position.x;
    const dy = this.target.y - this.position.y;

    // Settle exactly rather than creeping, so a still hand shows a still ring.
    if (Math.abs(dx) + Math.abs(dy) < 0.5) {
      this.position.x = this.target.x;
      this.position.y = this.target.y;
    } else {
      this.position.x += dx * k;
      this.position.y += dy * k;
    }

    this.history.push({ t, x: this.position.x, y: this.position.y });
    const cutoff = t - this.config.historyMs;
    while (this.history.length && this.history[0].t < cutoff) this.history.shift();
  }

  /**
   * Where the cursor was `ms` ago. Fingers drift as they fold into a pinch, so
   * a click aims from before the fold rather than from the moment of contact.
   */
  aimAt(ms: number, now: number): { x: number; y: number } {
    const cutoff = now - ms;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].t <= cutoff) return this.history[i];
    }
    return this.history[0] ?? this.position;
  }
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}
