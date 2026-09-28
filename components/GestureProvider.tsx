'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { usePathname } from 'next/navigation';
import { ScrollController } from '@/lib/scroll/controller';
import { TransformScroller } from '@/lib/scroll/scroller';
import { useGestureScroll } from '@/lib/react/useGestureScroll';
import { GestureCursor } from './GestureCursor';

type Gesture = ReturnType<typeof useGestureScroll>;

interface GestureContextValue {
  gesture: Gesture;
  controllerRef: React.RefObject<ScrollController | null>;
  /** Called by <ScrollContent> with the element the scroller should move. */
  registerContent: (el: HTMLDivElement | null) => void;
}

const GestureContext = createContext<GestureContextValue | null>(null);

export function useGesture() {
  const ctx = useContext(GestureContext);
  if (!ctx) throw new Error('useGesture must be used inside <GestureProvider>');
  return ctx;
}

/**
 * Owns the scroll engine and the gesture session for the whole site.
 *
 * Mounted once in the root layout so the engine survives route changes: the
 * camera, worker and model stay alive as you navigate. Tearing the session
 * down per route would mean a fresh permission prompt and a fresh model load
 * on every click.
 *
 * Note it renders `children` directly rather than wrapping them. The scrolled
 * element carries a transform, and a transformed ancestor becomes the
 * containing block for `position: fixed` descendants -- putting the nav inside
 * it would make the "fixed" header scroll away with the page. Only
 * <ScrollContent> is transformed; fixed chrome stays a sibling of it.
 */
export function GestureProvider({ children }: { children: React.ReactNode }) {
  const controllerRef = useRef<ScrollController | null>(null);
  const gesture = useGestureScroll(controllerRef);
  const [content, setContent] = useState<HTMLDivElement | null>(null);

  const registerContent = useCallback((el: HTMLDivElement | null) => {
    setContent(el);
  }, []);

  useEffect(() => {
    if (!content) return;

    const scroller = new TransformScroller(content);
    const controller = new ScrollController(scroller);
    controllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      scroller.destroy();
      controllerRef.current = null;
    };
  }, [content]);

  return (
    <GestureContext.Provider value={{ gesture, controllerRef, registerContent }}>
      {children}
      {gesture.status === 'running' && (
        <GestureCursor
          pointerRef={gesture.pointerRef}
          activeRef={gesture.aimingRef}
          pinchRef={gesture.pinchProgressRef}
        />
      )}
    </GestureContext.Provider>
  );
}

/**
 * The element the scroll engine actually moves. Everything inside it scrolls;
 * anything that must stay pinned to the viewport belongs outside it.
 *
 * Also returns to the top on navigation. The browser does that for free with
 * native scrolling, but we own the position, so a route change would otherwise
 * land you wherever the last page happened to be scrolled -- on a shorter page
 * that means opening it to blank space below its content.
 */
export function ScrollContent({ children }: { children: React.ReactNode }) {
  const { registerContent, controllerRef } = useGesture();
  const pathname = usePathname();

  useLayoutEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;

    // Jump immediately so the new page never paints mid-scroll...
    controller.physics.jumpTo(0);

    // ...then again once layout has settled. The new route's height is not
    // known on the first frame, and jumping before re-measuring would clamp
    // against the *previous* page's bounds -- which is how a short page opened
    // scrolled to its own footer.
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        controller.measure();
        controller.physics.jumpTo(0);
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname, controllerRef]);

  return <div ref={registerContent}>{children}</div>;
}
