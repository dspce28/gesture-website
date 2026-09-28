'use client';

import { useEffect, useRef, useState } from 'react';
import { useGestureScroll } from '@/lib/react/useGestureScroll';
import { ScrollController, type ControllerStats } from '@/lib/scroll/controller';
import { DEFAULT_PHYSICS, type PhysicsConfig } from '@/lib/scroll/physics';
import { TransformScroller } from '@/lib/scroll/scroller';
import { GestureCursor } from './GestureCursor';
import { GesturePanel } from './GesturePanel';
import { ScrollHud } from './ScrollHud';

const SECTIONS = [
  { t: 'Momentum, not position', b: 'Every input injects velocity into one integrator. A wheel notch, a keypress and a pointed finger all arrive the same way, so they cannot feel like different mechanisms.' },
  { t: 'Time, not frames', b: 'Decay resolves against elapsed seconds, never a per-frame fraction. A dropped frame changes nothing about how far the page travels.' },
  { t: 'The compositor does the work', b: 'Content rides a translate3d transform, so movement happens on the compositor rather than through layout on every frame.' },
  { t: 'One source of truth', b: 'Native document scrolling is off. Two scroll positions for one page means dragging the scrollbar moves one and not the other, so the engine owns the position outright.' },
  { t: 'Telemetry stays off the main thread', b: 'HUD numbers are written straight to the DOM from a paint loop. Holding them in component state re-rendered the page on every frame and starved the loop being measured.' },
  { t: 'Swappable output', b: 'The same physics can drive native scrolling instead, which is what the browser extension will need on sites whose DOM we do not own.' },
  { t: 'Edges are hard stops', b: 'Velocity is zeroed at the boundaries. Carrying it would make the page feel like it is straining against a wall.' },
  { t: 'Keyboard is first-class', b: 'Arrows, space, page keys, home and end all feed the same engine, and typing is never hijacked.' },
];

export function ScrollLab() {
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ScrollController | null>(null);
  const statsRef = useRef<ControllerStats>({
    position: 0,
    velocity: 0,
    max: 0,
    fps: 0,
  });

  const [physics, setPhysics] = useState<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const gesture = useGestureScroll(controllerRef);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const scroller = new TransformScroller(el);
    const controller = new ScrollController(scroller, {
      // Straight into a ref. No setState here: this fires every frame.
      onUpdate: (s) => {
        statsRef.current = s;
      },
    });
    controllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      scroller.destroy();
      controllerRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={contentRef}>
        <div className="lab">
          <p className="eyebrow">Phase 2 · point to scroll</p>
          <h1>Scroll physics</h1>
          <p className="lead">
            Built and tuned on the wheel first, with no camera involved. Pointing
            now feeds the same engine: your finger angle is just another velocity
            source, so whatever the wheel feels like, your hand feels like too.
          </p>
          <p className="lead">
            Use the wheel, arrows, space, page keys, home and end. Or enable
            gestures on the left and point your finger up or down, holding the
            direction for as long as you want the page to move.
          </p>

          {SECTIONS.map((s, i) => (
            <section key={s.t} className="card">
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{s.t}</h2>
                <p>{s.b}</p>
              </div>
            </section>
          ))}

          <footer className="end">
            <p>Bottom. Velocity is zeroed here, not absorbed.</p>
            <button
              className="btn"
              onClick={() => controllerRef.current?.scrollTo(0)}
            >
              Spring back to top
            </button>
          </footer>
        </div>
      </div>

      <GesturePanel
        status={gesture.status}
        error={gesture.error}
        config={gesture.config}
        setConfig={gesture.setConfig}
        landmarksRef={gesture.landmarksRef}
        pointRef={gesture.pointRef}
        tapStateRef={gesture.tapStateRef}
        statsRef={gesture.statsRef}
        onStart={gesture.start}
        onStop={gesture.stop}
      />

      {gesture.status === 'running' && (
        <GestureCursor
          pointerRef={gesture.pointerRef}
          activeRef={gesture.aimingRef}
          pinchRef={gesture.pinchProgressRef}
        />
      )}

      <ScrollHud
        statsRef={statsRef}
        controllerRef={controllerRef}
        config={physics}
        setConfig={setPhysics}
      />
    </>
  );
}
