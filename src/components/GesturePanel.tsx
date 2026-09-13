import type { SwipeConfig, SwipeState } from '../gesture/swipe';
import type { SessionStats } from '../gesture/session';
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
  { key: 'engageSpeed', label: 'engage at', min: 0.4, max: 5, step: 0.1 },
  { key: 'releaseSpeed', label: 'release at', min: 0.1, max: 3, step: 0.1 },
  { key: 'gain', label: 'gain', min: 80, max: 1400, step: 20 },
];

const BLOCKED_LABEL: Record<SwipeState['blockedBy'], string> = {
  none: 'driving',
  pose: 'point your index finger',
  speed: 'swipe faster to engage',
  'no-hand': 'show your hand',
};

interface Props {
  status: GestureStatus;
  error: string | null;
  stats: SessionStats | null;
  swipe: SwipeState;
  config: SwipeConfig;
  setConfig: React.Dispatch<React.SetStateAction<SwipeConfig>>;
  landmarksRef: React.RefObject<Landmark[] | null>;
  onStart: () => void;
  onStop: () => void;
}

export function GesturePanel({
  status, error, stats, swipe, config, setConfig, landmarksRef, onStart, onStop,
}: Props) {
  const running = status === 'running';

  return (
    <aside className="ghud">
      {running ? (
        <>
          <HandCanvas landmarksRef={landmarksRef} size={176} />

          <div className={`state ${swipe.driving ? 'live' : ''}`}>
            {BLOCKED_LABEL[swipe.blockedBy]}
          </div>

          {/* Speed meter, centred on zero: left is swipe-up, right is down. */}
          <div className="meter" aria-hidden="true">
            <div className="meter-zero" />
            <div
              className="meter-fill"
              style={{
                left: swipe.speed < 0 ? 'auto' : '50%',
                right: swipe.speed < 0 ? '50%' : 'auto',
                width: `${Math.min(50, (Math.abs(swipe.speed) / 5) * 50)}%`,
              }}
            />
            <div
              className="meter-gate"
              style={{ left: `${50 + (config.engageSpeed / 5) * 50}%` }}
            />
            <div
              className="meter-gate"
              style={{ left: `${50 - (config.engageSpeed / 5) * 50}%` }}
            />
          </div>

          <div className="hud-row">
            <span>finger</span>
            <strong>{swipe.speed.toFixed(2)}</strong>
          </div>
          <div className="hud-row">
            <span>inference</span>
            <strong className={(stats?.fps ?? 0) >= 20 ? 'ok' : 'warn'}>
              {stats?.fps ?? 0} fps
            </strong>
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
                checked={config.requirePointPose}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, requirePointPose: e.target.checked }))
                }
              />
              <span>require pointing pose</span>
            </label>
          </div>

          <button className="reset" onClick={onStop}>
            Stop camera
          </button>
        </>
      ) : (
        <>
          <p className="ghud-intro">
            Swipe your index finger <strong>up</strong> to scroll down. Curl the
            finger to move it back without scrolling.
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
