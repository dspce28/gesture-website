'use client';

import { useEffect, useRef } from 'react';
import type { ScrollController, ControllerStats } from '@/lib/scroll/controller';
import { DEFAULT_PHYSICS, type PhysicsConfig } from '@/lib/scroll/physics';

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

interface Props {
  statsRef: React.RefObject<ControllerStats>;
  controllerRef: React.RefObject<ScrollController | null>;
  config: PhysicsConfig;
  setConfig: React.Dispatch<React.SetStateAction<PhysicsConfig>>;
}

/**
 * Reads controller telemetry from a ref inside its own rAF loop and writes to
 * the DOM directly. Holding these numbers in React state re-rendered the whole
 * page on every scroll frame, which starved the very loop being measured --
 * scrolling fell to under 30fps with the HUD on screen.
 */
export function ScrollHud({ statsRef, controllerRef, config, setConfig }: Props) {
  const fpsEl = useRef<HTMLElement>(null);
  const velEl = useRef<HTMLElement>(null);
  const posEl = useRef<HTMLElement>(null);

  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = requestAnimationFrame(paint);
      const s = statsRef.current;
      if (fpsEl.current) {
        fpsEl.current.textContent = String(s.fps);
        fpsEl.current.className = s.fps >= 55 ? 'ok' : 'warn';
      }
      if (velEl.current) velEl.current.textContent = String(Math.round(s.velocity));
      if (posEl.current) {
        posEl.current.textContent = `${Math.round(s.position)}/${Math.round(s.max)}`;
      }
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [statsRef]);

  useEffect(() => {
    const c = controllerRef.current;
    if (c) Object.assign(c.physics.config, config);
  }, [config, controllerRef]);

  return (
    <aside className="hud">
      <div className="hud-row">
        <span>fps</span>
        <strong ref={fpsEl}>0</strong>
      </div>
      <div className="hud-row">
        <span>velocity</span>
        <strong ref={velEl}>0</strong>
      </div>
      <div className="hud-row">
        <span>position</span>
        <strong ref={posEl}>0/0</strong>
      </div>

      <div className="knobs">
        {KNOBS.map((k) => (
          <label key={k.key} title={k.hint}>
            <span>
              {k.label}
              <em>{config[k.key]}</em>
            </span>
            <input
              type="range"
              min={k.min}
              max={k.max}
              step={k.step}
              value={config[k.key]}
              onChange={(e) =>
                setConfig((c) => ({ ...c, [k.key]: Number(e.target.value) }))
              }
            />
          </label>
        ))}
      </div>

      <button className="reset" onClick={() => setConfig({ ...DEFAULT_PHYSICS })}>
        Reset defaults
      </button>
    </aside>
  );
}
