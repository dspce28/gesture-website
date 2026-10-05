'use client';

import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal, reimplemented for the routed site.
 *
 * IntersectionObserver still works under our transform-based scroller: the
 * intersection rectangle accounts for transforms, so elements genuinely enter
 * and leave the viewport as the content translates.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll<HTMLElement>('.rev, .rev-l, .rev-r');
    if (!targets.length) return;

    // Respect a reduced-motion preference by simply showing everything.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((t) => t.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  return ref;
}

/** Counts up to `to` once, when it first scrolls into view. */
export function useCountUp(to: number, durationMs = 1400) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(to);
      return;
    }

    let raf = 0;
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const startedAt = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - startedAt) / durationMs);
        // Ease out, so it decelerates into the final number.
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, durationMs]);

  return ref;
}

/**
 * A number that counts up once, the first time it scrolls into view.
 *
 * Separate component rather than a bare hook so several can sit side by side
 * in the stats strip, each owning its own observer and animation.
 */
export function CountUp({
  to,
  suffix,
  durationMs = 1600,
}: {
  to: number;
  suffix?: string;
  durationMs?: number;
}) {
  const ref = useCountUp(to, durationMs);
  return (
    <span className="stat-num">
      <span className="stat-count" ref={ref}>0</span>
      {suffix && <span className="accent">{suffix}</span>}
    </span>
  );
}
