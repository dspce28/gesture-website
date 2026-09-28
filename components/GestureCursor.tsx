'use client';

import { useEffect, useRef } from 'react';
import type { PointerTracker } from '@/lib/gesture/pointer';
import { clickableAt } from '@/lib/dom/click';

interface Props {
  pointerRef: React.RefObject<PointerTracker | null>;
  /** True while the cursor is aiming rather than parked by a scroll pose. */
  activeRef: React.RefObject<boolean>;
  /** Rises toward 1 as a pinch closes, for the ring's squeeze feedback. */
  pinchRef: React.RefObject<number>;
}

/**
 * The gesture cursor: a ring that follows the fingertip.
 *
 * Paints itself from refs in its own rAF loop and writes transforms directly,
 * never through React state -- at tracking rate that would re-render the page
 * continuously and starve the scroll loop.
 *
 * The hover test is throttled and skipped while the ring is parked, because
 * elementFromPoint forces a style flush and doing that every frame is exactly
 * the layout thrash the architecture exists to avoid.
 */
export function GestureCursor({ pointerRef, activeRef, pinchRef }: Props) {
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastHoverAt = 0;
    let lastHoverX = -1;
    let lastHoverY = -1;
    let hovering = false;

    const paint = (t: number) => {
      raf = requestAnimationFrame(paint);
      const p = pointerRef.current;
      const ring = ringRef.current;
      if (!p || !ring) return;

      const active = activeRef.current;
      const { x, y } = p.position;

      ring.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      ring.style.opacity = active ? '1' : '0.25';

      // Squeeze the ring as the pinch closes: feedback before the click lands.
      const squeeze = 1 - Math.min(1, Math.max(0, pinchRef.current)) * 0.45;
      ring.style.setProperty('--squeeze', String(squeeze));

      if (!active) {
        if (hovering) {
          ring.classList.remove('over');
          hovering = false;
        }
        return;
      }

      // Only re-test when the ring has actually moved, and at most ~15Hz.
      const moved = Math.hypot(x - lastHoverX, y - lastHoverY) > 3;
      if (moved && t - lastHoverAt > 66) {
        lastHoverAt = t;
        lastHoverX = x;
        lastHoverY = y;
        const over = !!clickableAt(x, y);
        if (over !== hovering) {
          ring.classList.toggle('over', over);
          hovering = over;
        }
      }
    };

    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [pointerRef, activeRef, pinchRef]);

  return <div className="gesture-cursor" ref={ringRef} aria-hidden="true" />;
}
