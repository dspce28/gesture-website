/**
 * One Euro filter.
 *
 * Adaptive smoothing: heavy when the input moves slowly, light when it moves
 * fast. That is exactly the trade a pointing hand needs -- steady when you are
 * holding still and aiming, responsive the instant you flick. A fixed low-pass
 * filter has to pick one or the other and is wrong half the time.
 *
 * Casiez, Roussel & Vogel (2012).
 */
export class OneEuroFilter {
  private x: number | null = null;
  private dx = 0;
  private t: number | null = null;

  /** Baseline cutoff in Hz. Lower = smoother when still. */
  private minCutoff: number;
  /** How aggressively the cutoff opens up with speed. */
  private beta: number;
  /** Cutoff for the derivative estimate itself. */
  private dCutoff: number;

  constructor(minCutoff = 1.0, beta = 3.0, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private static alpha(cutoff: number, dt: number) {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  /** Feed a sample at time `t` (ms). Returns the filtered value. */
  filter(value: number, t: number): number {
    if (this.x === null || this.t === null) {
      this.x = value;
      this.t = t;
      return value;
    }

    const dt = Math.max(1e-3, (t - this.t) / 1000);
    this.t = t;

    const rawDx = (value - this.x) / dt;
    this.dx += (rawDx - this.dx) * OneEuroFilter.alpha(this.dCutoff, dt);

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    this.x += (value - this.x) * OneEuroFilter.alpha(cutoff, dt);
    return this.x;
  }

  /** Velocity of the filtered signal, in units per second. */
  get velocity() {
    return this.dx;
  }

  reset() {
    this.x = null;
    this.dx = 0;
    this.t = null;
  }
}

/** Convenience wrapper filtering a 2D point with shared parameters. */
export class OneEuroPoint {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;

  constructor(minCutoff = 1.0, beta = 3.0) {
    this.fx = new OneEuroFilter(minCutoff, beta);
    this.fy = new OneEuroFilter(minCutoff, beta);
  }

  filter(x: number, y: number, t: number) {
    return { x: this.fx.filter(x, t), y: this.fy.filter(y, t) };
  }

  get velocity() {
    return { x: this.fx.velocity, y: this.fy.velocity };
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
  }
}
