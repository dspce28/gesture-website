import { useEffect, useRef } from 'react';
import type { SessionStats } from '../gesture/session';
import type { SwipeConfig, SwipeState } from '../gesture/swipe';
import type { Landmark } from '../gesture/types';
import type { GestureStatus } from '../react/useGestureScroll';
import { HandCanvas } from './HandCanvas';

const SWIPE_KNOBS: ReadonlyArray<{
  key: 'engageSpeed' | 'releaseSpeed' | 'gain';
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: 'engageSpeed', label: 'engage at', min: 0.2, max: 4, step: 0.1 },
  { key: 'releaseSpeed', label: 'release at', min: 0.1, max: 2.5, step: 0.1 },
  { key: 'gain', label: 'gain', min: 80, max: 1400, step: 20 },
];

const BLOCKED_LABEL: Record<SwipeState['blockedBy'], string> = {
  none: 'driving',
  pose: 'straighten your index finger',
  speed: 'swipe faster to engage',
  'no-hand': 'show your hand',
};

/** Full-scale of the speed meter, in hand-widths/s. */
const METER_RANGE = 5;

interface Props {
  status: GestureStatus;
  error: string | null;
  config: SwipeConfig;
  setConfig: React.Dispatch<React.SetStateAction<SwipeConfig>>;
  landmarksRef: React.RefObject<Landmark[] | null>;
  swipeRef: React.RefObject<SwipeState>;
  statsRef: React.RefObject<SessionStats | null>;
  onStart: () => void;
  onStop: () => void;
}

export function GesturePanel({
  status, error, config, setConfig, landmarksRef, swipeRef, statsRef, onStart, onStop,
}: Props) {
  const running = status === 'running';

  const stateEl = useRef<HTMLDivElement>(null);
  const fillEl = useRef<HTMLDivElement>(null);
  const speedEl = useRef<HTMLElement>(null);
  const fpsEl = useRef<HTMLElement>(null);
  const costEl = useRef<HTMLElement>(null);

  /**
   * Paint telemetry from refs in our own loop. Routing these through React
   * state would re-render this tree on every tracked frame, and that cost lands
   * on the main thread -- starving the scroll loop it is meant to be reporting
   * on. Measured: doing it the naive way dropped scrolling to under 30fps.
   */
  useEffect(() => {
    if (!running) return;
    let raf = 0;

    const paint = () => {
      raf = requestAnimationFrame(paint);
      const s = swipeRef.current;
      const stats = statsRef.current;

      if (stateEl.current) {
        stateEl.current.textContent = BLOCKED_LABEL[s.blockedBy];
        stateEl.current.classList.toggle('live', s.driving);
      }
      if (speedEl.current) speedEl.current.textContent = s.speed.toFixed(2);
      if (fpsEl.current) {
        fpsEl.current.textContent = `${stats?.fps ?? 0} fps`;
        fpsEl.current.className = (stats?.fps ?? 0) >= 20 ? 'ok' : 'warn';
      }
      if (costEl.current && stats) {
        costEl.current.textContent = `${stats.inferenceMs.toFixed(0)}ms ${stats.delegate}`;
      }
      if (fillEl.current) {
        const pct = Math.min(50, (Math.abs(s.speed) / METER_RANGE) * 50);
        const up = s.speed < 0;
        fillEl.current.style.left = up ? 'auto' : '50%';
        fillEl.current.style.right = up ? '50%' : 'auto';
        fillEl.current.style.width = `${pct}%`;
      }
    };

    paint();
    return () => cancelAnimationFrame(raf);
  }, [running, swipeRef, statsRef]);

  const gateOffset = (config.engageSpeed / METER_RANGE) * 50;

  return (
    <aside className="ghud">
      {running ? (
        <>
          <HandCanvas landmarksRef={landmarksRef} size={176} />

          <div className="state" ref={stateEl}>
            show your hand
          </div>

          {/* Speed meter, centred on zero: left is swipe-up, right is down. */}
          <div className="meter" aria-hidden="true">
            <div className="meter-zero" />
            <div className="meter-fill" ref={fillEl} />
            <div className="meter-gate" style={{ left: `${50 + gateOffset}%` }} />
            <div className="meter-gate" style={{ left: `${50 - gateOffset}%` }} />
          </div>

          <div className="hud-row">
            <span>finger</span>
            <strong ref={speedEl}>0.00</strong>
          </div>
          <div className="hud-row">
            <span>tracking</span>
            <strong ref={fpsEl}>0 fps</strong>
          </div>
          <div className="hud-row">
            <span>cost</span>
            <strong ref={costEl}>—</strong>
          </div>

          <div className="knobs">
            {SWIPE_KNOBS.map((k) => (
              <label key={k.key}>
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
                checked={config.requireIndexExtended}
                onChange={(e) =>
                  setConfig((c) => ({
                    ...c,
                    requireIndexExtended: e.target.checked,
                  }))
                }
              />
              <span>curl finger to pause</span>
            </label>
          </div>

          <button className="reset" onClick={onStop}>
            Stop camera
          </button>
        </>
      ) : (
        <>
          <p className="ghud-intro">
            Swipe your hand <strong>up</strong> to scroll down. Curl your index
            finger to move back without scrolling.
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
