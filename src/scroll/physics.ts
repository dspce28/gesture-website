/**
 * Momentum scroll physics.
 *
 * One velocity integrator serves every input -- wheel, keyboard, touch, and
 * later a gesture flick. They all do the same thing: inject velocity. That is
 * what makes gesture scrolling feel identical to wheel scrolling instead of
 * like a separate, worse mechanism bolted on beside it.
 *
 * Every decay here is normalised against elapsed time. A fixed per-frame
 * fraction (`v *= 0.95` each tick) silently couples motion to frame rate, so a
 * dropped frame moves the page a different distance than a clean one -- the
 * defect that made the original prototype lurch.
 */

export interface PhysicsConfig {
  /** Fraction of velocity retained per 1/60s. Lower = stops sooner. */
  friction: number;
  /** px/s of velocity injected per px of wheel delta. */
  wheelGain: number;
  /** Hard cap on velocity, px/s. Keeps a fast flick from teleporting. */
  maxVelocity: number;
  /** Below this speed (px/s) we snap to rest rather than creep. */
  stopThreshold: number;
  /** Spring stiffness used by scrollTo(), in 1/s. */
  springStiffness: number;
  /** Spring damping ratio. 1 = critically damped, no overshoot. */
  springDamping: number;
}

export const DEFAULT_PHYSICS: PhysicsConfig = {
  friction: 0.92,
  wheelGain: 11,
  maxVelocity: 9000,
  stopThreshold: 4,
  springStiffness: 120,
  springDamping: 1,
};

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

export class ScrollPhysics {
  position = 0;
  velocity = 0;
  max = 0;

  /** Non-null while a scrollTo() animation is running. */
  private springTarget: number | null = null;

  config: PhysicsConfig;

  constructor(config: PhysicsConfig = { ...DEFAULT_PHYSICS }) {
    this.config = config;
  }

  /** Inject velocity. Used by every input source. */
  addVelocity(dv: number) {
    this.springTarget = null; // a manual input always wins over an animation
    this.velocity = clamp(
      this.velocity + dv,
      -this.config.maxVelocity,
      this.config.maxVelocity
    );
  }

  /**
   * Set velocity outright, for a continuous input that holds the page in
   * motion -- a finger mid-swipe, say. Distinct from addVelocity: a wheel notch
   * is a discrete shove that should accumulate, whereas a swipe is a sustained
   * hold whose speed *is* the target. Accumulating the latter every frame would
   * run away instantly.
   */
  drive(v: number) {
    this.springTarget = null;
    this.velocity = clamp(
      v,
      -this.config.maxVelocity,
      this.config.maxVelocity
    );
  }

  /** A wheel notch or trackpad delta, in CSS pixels. */
  wheel(deltaY: number) {
    this.addVelocity(deltaY * this.config.wheelGain);
  }

  /** Animate to an absolute offset (anchor links, "back to top"). */
  scrollTo(y: number) {
    this.springTarget = clamp(y, 0, this.max);
    this.velocity = 0;
  }

  /** Jump with no animation. */
  jumpTo(y: number) {
    this.springTarget = null;
    this.velocity = 0;
    this.position = clamp(y, 0, this.max);
  }

  get isResting(): boolean {
    return this.velocity === 0 && this.springTarget === null;
  }

  /**
   * Advance by `dt` seconds. Returns true if the position changed, so callers
   * can skip DOM writes while at rest.
   */
  step(dt: number): boolean {
    const before = this.position;
    const { friction, stopThreshold, springStiffness, springDamping } =
      this.config;

    if (this.springTarget !== null) {
      // Damped spring toward the target. Integrated the same way as momentum
      // so both paths behave identically under a dropped frame.
      const dx = this.springTarget - this.position;
      const accel =
        springStiffness * dx - 2 * springDamping * Math.sqrt(springStiffness) * this.velocity;
      this.velocity += accel * dt;
      this.position += this.velocity * dt;

      if (Math.abs(dx) < 0.5 && Math.abs(this.velocity) < stopThreshold) {
        this.position = this.springTarget;
        this.velocity = 0;
        this.springTarget = null;
      }
    } else if (this.velocity !== 0) {
      // Exponential decay, resolved over real elapsed time rather than frames.
      this.velocity *= Math.pow(friction, dt * 60);
      if (Math.abs(this.velocity) < stopThreshold) this.velocity = 0;
      this.position += this.velocity * dt;
    }

    // Edges are hard stops: keeping velocity here would make the page feel
    // like it is straining against the boundary.
    if (this.position < 0) {
      this.position = 0;
      this.velocity = 0;
      this.springTarget = null;
    } else if (this.position > this.max) {
      this.position = this.max;
      this.velocity = 0;
      this.springTarget = null;
    }

    return this.position !== before;
  }
}
