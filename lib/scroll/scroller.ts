/**
 * Scroller backends.
 *
 * The physics engine decides *where* the page should be; a Scroller decides
 * *how* that position is applied. Two implementations exist because our two
 * targets have incompatible constraints:
 *
 *   TransformScroller -- our own site. Content rides on a compositor transform,
 *     which is the smoothest option available, but it restructures the DOM.
 *
 *   NativeScroller -- the browser extension. On someone else's site we cannot
 *     restructure anything, so we drive native scrolling instead. Less ideal,
 *     but still smooth once the main thread is not blocked, which was the
 *     prototype's actual problem.
 *
 * Keeping both behind one interface from the start means the extension is a new
 * backend rather than a rewrite.
 */

export interface Scroller {
  /** Current offset in px. */
  readonly position: number;
  /** Maximum scrollable offset in px. */
  readonly max: number;
  /** Write a new offset. Called at most once per frame. */
  apply(y: number): void;
  /** Re-read layout after a resize or content change. */
  measure(): void;
  destroy(): void;
}

/**
 * Moves content with translate3d inside a fixed viewport.
 *
 * Native document scrolling is switched off entirely rather than kept alongside
 * this. Keeping both means two sources of truth for one position: dragging the
 * native scrollbar would move the document while the content sat still. Since
 * the physics engine has to own the position for gesture input to work at all,
 * it owns it outright, and the UI draws its own scroll indicator.
 */
export class TransformScroller implements Scroller {
  private observer: ResizeObserver;
  private _position = 0;
  private _max = 0;
  private content: HTMLElement;
  private prevOverflow: string;

  constructor(content: HTMLElement) {
    this.content = content;

    this.prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    Object.assign(content.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      willChange: 'transform',
    } satisfies Partial<CSSStyleDeclaration>);

    this.observer = new ResizeObserver(() => this.measure());
    this.observer.observe(content);
    this.measure();
  }

  get position() {
    return this._position;
  }

  get max() {
    return this._max;
  }

  measure() {
    this._max = Math.max(0, this.content.scrollHeight - window.innerHeight);
  }

  apply(y: number) {
    this._position = y;
    // Rounding to whole device pixels avoids sub-pixel text shimmer during
    // slow scrolls without any visible loss of smoothness.
    const dpr = window.devicePixelRatio || 1;
    const snapped = Math.round(y * dpr) / dpr;
    this.content.style.transform = `translate3d(0, ${-snapped}px, 0)`;
  }

  destroy() {
    this.observer.disconnect();
    document.documentElement.style.overflow = this.prevOverflow;
    this.content.style.cssText = '';
  }
}

/** Drives the browser's own scrolling. For hosts whose DOM we do not own. */
export class NativeScroller implements Scroller {
  private _max = 0;

  constructor() {
    this.measure();
  }

  get position() {
    return window.scrollY;
  }

  get max() {
    return this._max;
  }

  measure() {
    this._max = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight
    );
  }

  apply(y: number) {
    // 'instant' matters: the page's own CSS may set scroll-behavior: smooth,
    // which would otherwise animate on top of our animation.
    window.scrollTo({ top: y, behavior: 'instant' });
  }

  destroy() {
    /* nothing to undo */
  }
}
