/**
 * Binds the physics engine to a Scroller backend and owns the one rAF loop
 * that writes to the DOM.
 *
 * Input sources never touch the DOM themselves -- they only inject velocity.
 * That keeps DOM writes to a single point per frame and means adding gesture
 * input later changes nothing here.
 */
import { DEFAULT_PHYSICS, ScrollPhysics, type PhysicsConfig } from './physics';
import type { Scroller } from './scroller';

export interface ControllerStats {
  position: number;
  velocity: number;
  max: number;
  /** Frames per second of the scroll loop itself. */
  fps: number;
}

export interface ControllerOptions {
  physics?: Partial<PhysicsConfig>;
  /** Called once per frame while moving, for HUDs and scroll-linked effects. */
  onUpdate?: (stats: ControllerStats) => void;
}

export class ScrollController {
  readonly physics: ScrollPhysics;
  private raf = 0;
  private lastT = 0;
  private running = false;
  private frames = 0;
  private fpsWindowAt = 0;
  private fps = 0;
  private readonly onUpdate?: (stats: ControllerStats) => void;

  private scroller: Scroller;

  constructor(scroller: Scroller, opts: ControllerOptions = {}) {
    this.scroller = scroller;
    this.physics = new ScrollPhysics({ ...DEFAULT_PHYSICS, ...opts.physics });
    this.onUpdate = opts.onUpdate;
    this.physics.position = scroller.position;
    this.syncBounds();
  }

  private syncBounds() {
    this.scroller.measure();
    this.physics.max = this.scroller.max;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastT = performance.now();
    this.fpsWindowAt = this.lastT;

    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('resize', this.onResize);

    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('resize', this.onResize);
  }

  /** Re-read the content's size. Call after the page's content changes. */
  measure() {
    this.syncBounds();
  }

  /** The single entry point for every input source, gestures included. */
  addVelocity(dv: number) {
    this.physics.addVelocity(dv);
  }

  scrollTo(y: number) {
    this.physics.scrollTo(y);
  }

  private onResize = () => this.syncBounds();

  private onWheel = (e: WheelEvent) => {
    // We own scrolling now, so the browser must not also do it.
    e.preventDefault();
    // DOM_DELTA_LINE (1) and DOM_DELTA_PAGE (2) report in lines/pages, not px.
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
    this.physics.wheel(e.deltaY * scale);
  };

  private onKey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    // Never hijack keys while someone is typing.
    if (target?.closest('input, textarea, select, [contenteditable]')) return;

    const page = window.innerHeight * 0.9;
    switch (e.key) {
      case 'ArrowDown': this.physics.wheel(60); break;
      case 'ArrowUp': this.physics.wheel(-60); break;
      case 'PageDown': case ' ': this.physics.wheel(page); break;
      case 'PageUp': this.physics.wheel(-page); break;
      case 'Home': this.physics.scrollTo(0); break;
      case 'End': this.physics.scrollTo(this.physics.max); break;
      default: return;
    }
    e.preventDefault();
  };

  private tick = (t: number) => {
    this.raf = requestAnimationFrame(this.tick);

    // Cap dt so a backgrounded tab does not resume with one enormous jump.
    const dt = Math.min(0.05, (t - this.lastT) / 1000) || 0.016;
    this.lastT = t;

    this.frames++;
    if (t - this.fpsWindowAt >= 1000) {
      this.fps = Math.round((this.frames * 1000) / (t - this.fpsWindowAt));
      this.frames = 0;
      this.fpsWindowAt = t;
    }

    // The scroller re-measures itself whenever its content resizes, but the
    // bound the physics clamps against has to follow. Copying the cached value
    // every frame is free and means a route change or a late-loading image can
    // never leave the page able to scroll past its own end.
    this.physics.max = this.scroller.max;

    const moved = this.physics.step(dt);
    if (moved) this.scroller.apply(this.physics.position);

    this.onUpdate?.({
      position: this.physics.position,
      velocity: this.physics.velocity,
      max: this.physics.max,
      fps: this.fps,
    });
  };
}
