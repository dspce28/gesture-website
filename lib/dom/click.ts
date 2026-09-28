/**
 * Turning a gesture click into something the page actually responds to.
 *
 * Kept out of src/gesture because it needs the DOM. The engine decides *that*
 * a click happened and roughly where; this decides what it lands on.
 */

const CLICKABLE =
  'a,button,[role=button],[onclick],input,select,textarea,label,summary';

/** Ignore our own overlay chrome when asking what is under the cursor. */
function elementAt(x: number, y: number): Element | null {
  const el = document.elementFromPoint(x, y);
  if (!el) return null;
  return el.closest('.gesture-cursor') ? null : el;
}

export interface MagnetTarget {
  el: Element;
  x: number;
  y: number;
  rect: DOMRect;
}

/**
 * The nearest clickable to a point, if it is close enough to be worth snapping
 * to. Huge containers are excluded: snapping to the centre of a full-width
 * wrapper would drag the cursor somewhere the user never aimed.
 */
export function clickableAt(x: number, y: number, maxRadius = 56): MagnetTarget | null {
  const el = elementAt(x, y);
  const hit = el?.closest(CLICKABLE);
  if (!hit) return null;

  const rect = hit.getBoundingClientRect();
  if (rect.width > 460 || rect.height > 240) return null;

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const reach = maxRadius + Math.max(rect.width, rect.height) / 2;
  if (Math.hypot(cx - x, cy - y) > reach) return null;

  return { el: hit, x: cx, y: cy, rect };
}

function fire(type: string, el: Element, x: number, y: number, extra: object = {}) {
  el.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      view: window,
      ...extra,
    })
  );
}

/**
 * Dispatch a full click at a point, snapping to a nearby control first.
 * Returns where the click actually landed, for the ripple.
 */
export function clickAt(x: number, y: number): { x: number; y: number } {
  const target = clickableAt(x, y);
  const p = target ? { x: target.x, y: target.y } : { x, y };

  const el = elementAt(p.x, p.y);
  if (!el) return p;

  // Pointer events first, then mouse, matching what a real click produces --
  // libraries commonly listen for one or the other, not both.
  fire('pointerdown', el, p.x, p.y, { pointerId: 1, pointerType: 'mouse', isPrimary: true });
  fire('mousedown', el, p.x, p.y, { button: 0, buttons: 1 });
  fire('pointerup', el, p.x, p.y, { pointerId: 1, pointerType: 'mouse', isPrimary: true });
  fire('mouseup', el, p.x, p.y, { button: 0 });
  fire('click', el, p.x, p.y, { button: 0 });

  if (el instanceof HTMLElement) {
    try {
      el.focus({ preventScroll: true });
    } catch {
      /* not focusable */
    }
  }
  return p;
}

/** A brief expanding ring at the click point, so the user sees it registered. */
export function ripple(x: number, y: number) {
  const dot = document.createElement('div');
  dot.className = 'gesture-ripple';
  dot.style.left = `${x}px`;
  dot.style.top = `${y}px`;
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 600);
}
