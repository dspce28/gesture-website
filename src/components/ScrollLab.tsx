import { useEffect, useRef, useState } from 'react';
import { useGestureScroll } from '../react/useGestureScroll';
import { GesturePanel } from './GesturePanel';
import { ScrollController } from '../scroll/controller';
import { DEFAULT_PHYSICS, type PhysicsConfig } from '../scroll/physics';
import { TransformScroller } from '../scroll/scroller';

/** Tunable knobs, with the ranges that actually matter for feel. */
const KNOBS: ReadonlyArray<{
  key: keyof PhysicsConfig;
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  { key: 'friction', label: 'friction', min: 0.8, max: 0.99, step: 0.005, hint: 'how long a flick coasts' },
  { key: 'wheelGain', label: 'wheel gain', min: 2, max: 30, step: 0.5, hint: 'velocity per notch' },
  { key: 'maxVelocity', label: 'max velocity', min: 1000, max: 20000, step: 250, hint: 'px/s ceiling' },
  { key: 'stopThreshold', label: 'stop below', min: 0.5, max: 30, step: 0.5, hint: 'px/s before snapping to rest' },
];

const SECTIONS = [
  { t: 'Momentum, not position', b: 'Every input injects velocity into one integrator. A wheel notch, a keypress, and later a gesture flick all arrive the same way, so they cannot feel like different mechanisms.' },
  { t: 'Time, not frames', b: 'Decay resolves against elapsed seconds, never a per-frame fraction. A dropped frame changes nothing about how far the page travels.' },
  { t: 'The compositor does the work', b: 'Content rides a translate3d transform, so movement happens on the compositor rather than through layout on every frame.' },
  { t: 'One source of truth', b: 'Native document scrolling is off. Two scroll positions for one page means dragging the scrollbar moves one and not the other, so the engine owns the position outright.' },
  { t: 'Swappable output', b: 'The same physics can drive native scrolling instead, which is what the browser extension will need on sites whose DOM we do not own.' },
  { t: 'Edges are hard stops', b: 'Velocity is zeroed at the boundaries. Carrying it would make the page feel like it is straining against a wall.' },
  { t: 'Keyboard is first-class', b: 'Arrows, space, page keys, home and end all feed the same engine, and typing is never hijacked.' },
  { t: 'Next: gestures', b: 'A swipe becomes a velocity impulse into this exact engine. If the feel is right here, it is right there too.' },
];

export function ScrollLab() {
  const contentRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ScrollController | null>(null);
  const [cfg, setCfg] = useState<PhysicsConfig>({ ...DEFAULT_PHYSICS });
  const [hud, setHud] = useState({ position: 0, velocity: 0, max: 0, fps: 0 });
  const gesture = useGestureScroll(controllerRef);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const scroller = new TransformScroller(el);
    const controller = new ScrollController(scroller, { onUpdate: setHud });
    controllerRef.current = controller;
    controller.start();

    return () => {
      controller.stop();
      scroller.destroy();
      controllerRef.current = null;
    };
  }, []);

  // Push knob changes straight into the live engine -- no restart, so you can
  // tune while the page is still moving.
  useEffect(() => {
    const c = controllerRef.current;
    if (c) Object.assign(c.physics.config, cfg);
  }, [cfg]);

  return (
    <>
      <div ref={contentRef}>
        <div className="lab">
          <p className="eyebrow">Phase 1 · scroll feel</p>
          <h1>Scroll physics</h1>
          <p className="lead">
            Built and tuned on the wheel first, with no camera involved. Tuning the
            feel and debugging hand tracking at once is how you end up
            unable to tell which layer is stuttering. Gestures now feed the same
            engine: a swipe is just another velocity source.
          </p>
          <p className="lead">
            Use the wheel, arrows, space, page keys, home and end. Or enable
            gestures on the left and swipe your index finger. Flick hard and
            watch it coast.
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
            <button className="btn" onClick={() => controllerRef.current?.scrollTo(0)}>
              Spring back to top
            </button>
          </footer>
        </div>
      </div>

      <GesturePanel
        status={gesture.status}
        error={gesture.error}
        stats={gesture.stats}
        swipe={gesture.swipe}
        config={gesture.config}
        setConfig={gesture.setConfig}
        landmarksRef={gesture.landmarksRef}
        onStart={gesture.start}
        onStop={gesture.stop}
      />

      <aside className="hud">
        <div className="hud-row">
          <span>fps</span>
          <strong className={hud.fps >= 55 ? 'ok' : 'warn'}>{hud.fps}</strong>
        </div>
        <div className="hud-row">
          <span>velocity</span>
          <strong>{Math.round(hud.velocity)}</strong>
        </div>
        <div className="hud-row">
          <span>position</span>
          <strong>
            {Math.round(hud.position)}/{Math.round(hud.max)}
          </strong>
        </div>

        <div className="knobs">
          {KNOBS.map((k) => (
            <label key={k.key} title={k.hint}>
              <span>
                {k.label}
                <em>{cfg[k.key]}</em>
              </span>
              <input
                type="range"
                min={k.min}
                max={k.max}
                step={k.step}
                value={cfg[k.key]}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, [k.key]: Number(e.target.value) }))
                }
              />
            </label>
          ))}
        </div>

        <button
          className="reset"
          onClick={() => setCfg({ ...DEFAULT_PHYSICS })}
        >
          Reset defaults
        </button>
      </aside>
    </>
  );
}
