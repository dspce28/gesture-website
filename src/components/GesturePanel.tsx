import { useEffect, useRef } from 'react';
import type { SessionStats } from '../gesture/session';
import type { PointingConfig, PointingState } from '../gesture/pointing';
import type { TapState } from '../gesture/tap';
import type { Landmark } from '../gesture/types';
import type { GestureStatus } from '../react/useGestureScroll';
import { HandCanvas } from './HandCanvas';

const KNOBS: ReadonlyArray<{
  key: 'neutral' | 'deadzone' | 'gain';
  label: string;
  min: number;
  max: number;
  step: number;
  hint: string;
}> = [
  { key: 'neutral', label: 'centre', min: -0.5, max: 0.8, step: 0.05, hint: 'elevation treated as "not pointing"' },
  { key: 'deadzone', label: 'dead band', min: 0.05, max: 0.5, step: 0.05, hint: 'how far past centre before it moves' },
  { key: 'gain', label: 'speed', min: 400, max: 6000, step: 100, hint: 'scroll px/s per unit of deflection' },
];

const LABEL: Record<PointingState['blockedBy'], string> = {
  none: 'scrolling',
  pose: 'curl your other fingers',
  neutral: 'point up or down',
  'no-hand': 'show your hand',
};

interface Props {
  status: GestureStatus;
  error: string | null;
  config: PointingConfig;
  setConfig: React.Dispatch<React.SetStateAction<PointingConfig>>;
  landmarksRef: React.RefObject<Landmark[] | null>;
  pointRef: React.RefObject<PointingState>;
  tapStateRef: React.RefObject<TapState>;
  statsRef: React.RefObject<SessionStats | null>;
  onStart: () => void;
  onStop: () => void;
}

/** Maps elevation (-1..1) to a 0..100% position on the dial. */
const pct = (elevation: number) => ((1 - elevation) / 2) * 100;

export function GesturePanel({
  status, error, config, setConfig, landmarksRef, pointRef, tapStateRef, statsRef,
  onStart, onStop,
}: Props) {
  const running = status === 'running';

  const stateEl = useRef<HTMLDivElement>(null);
  const needleEl = useRef<HTMLDivElement>(null);
  const degEl = useRef<HTMLElement>(null);
  const fpsEl = useRef<HTMLElement>(null);
  const costEl = useRef<HTMLElement>(null);
  const pinchEl = useRef<HTMLElement>(null);

  /**
   * Paint telemetry from refs in our own loop. Routing it through React state
   * re-renders the tree on every tracked frame, and that cost lands on the main
   * thread -- starving the scroll loop it is meant to be reporting on.
   */
  useEffect(() => {
    if (!running) return;
    let raf = 0;

    const paint = () => {
      raf = requestAnimationFrame(paint);
      const p = pointRef.current;
      const stats = statsRef.current;

      if (stateEl.current) {
        stateEl.current.textContent = LABEL[p.blockedBy];
        stateEl.current.className = `state ${p.direction !== 'neutral' ? 'live' : ''}`;
      }
      if (needleEl.current) needleEl.current.style.top = `${pct(p.elevation)}%`;
      if (degEl.current) degEl.current.textContent = `${p.degrees.toFixed(0)}°`;
      if (fpsEl.current) {
        fpsEl.current.textContent = `${stats?.fps ?? 0} fps`;
        fpsEl.current.className = (stats?.fps ?? 0) >= 20 ? 'ok' : 'warn';
      }
      if (costEl.current && stats) {
        costEl.current.textContent = `${stats.inferenceMs.toFixed(0)}ms ${stats.delegate}`;
      }
      if (pinchEl.current) {
        const tapState = tapStateRef.current;
        pinchEl.current.textContent = tapState.closed
          ? `closed ${'*'.repeat(tapState.pending + 1)}`
          : tapState.pinch.toFixed(2);
        pinchEl.current.className = tapState.closed ? 'ok' : '';
      }
    };

    paint();
    return () => cancelAnimationFrame(raf);
  }, [running, pointRef, tapStateRef, statsRef]);

  const upEdge = pct(config.neutral + config.deadzone);
  const downEdge = pct(config.neutral - config.deadzone);

  return (
    <aside className="ghud">
      {running ? (
        <>
          <div className="dialwrap">
            <HandCanvas landmarksRef={landmarksRef} size={150} />
            {/* Vertical dial: top is pointing up, bottom is pointing down. */}
            <div className="dial" aria-hidden="true">
              <div className="dial-zone" style={{ top: `${upEdge}%`, height: `${downEdge - upEdge}%` }} />
              <div className="dial-needle" ref={needleEl} />
              <span className="dial-cap up">up</span>
              <span className="dial-cap down">dn</span>
            </div>
          </div>

          <div className="state" ref={stateEl}>show your hand</div>

          <div className="hud-row">
            <span>angle</span>
            <strong ref={degEl}>0°</strong>
          </div>
          <div className="hud-row">
            <span>tracking</span>
            <strong ref={fpsEl}>0 fps</strong>
          </div>
          <div className="hud-row">
            <span>pinch</span>
            <strong ref={pinchEl}>—</strong>
          </div>
          <div className="hud-row">
            <span>cost</span>
            <strong ref={costEl}>—</strong>
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
            <label className="check">
              <input
                type="checkbox"
                checked={config.invert}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, invert: e.target.checked }))
                }
              />
              <span>flip direction</span>
            </label>
          </div>

          <button className="reset" onClick={onStop}>Stop camera</button>
        </>
      ) : (
        <>
          <p className="ghud-intro">
            Hold up your index finger with the others curled. Point it{' '}
            <strong>up</strong> to scroll up, <strong>down</strong> to scroll
            down, holding the direction as long as you want the page to move.
            Level the finger to aim the ring, then <strong>double-tap</strong>{' '}
            thumb to fingertip to click.
          </p>
          <button
            className="btn small"
            onClick={onStart}
            disabled={status === 'starting'}
          >
            {status === 'starting' ? 'Starting…' : 'Enable gestures'}
          </button>
        </>
      )}

      {error && <p className="ghud-error">{error}</p>}
    </aside>
  );
}
