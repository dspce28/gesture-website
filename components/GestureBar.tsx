'use client';

import { useEffect, useRef, useState } from 'react';
import { useGesture } from './GestureProvider';
import { HandCanvas } from './HandCanvas';

const HINT: Record<string, string> = {
  none: 'scrolling',
  pose: 'curl your other fingers',
  neutral: 'level = aim · tilt = scroll',
  'no-hand': 'show your hand',
};

/**
 * The site-wide gesture control. Collapsed to a pill until enabled, then a
 * small panel with the hand preview and live state.
 *
 * Deliberately never a requirement: the site works identically with mouse,
 * keyboard and touch, and this is an alternative input rather than the only
 * one. Camera permission gets denied, rooms are dark, webcams get covered.
 */
export function GestureBar() {
  const { gesture } = useGesture();
  const { status, error, pointRef, statsRef, landmarksRef } = gesture;
  const running = status === 'running';

  const [expanded, setExpanded] = useState(false);
  const hintRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);

  // Telemetry painted from refs, never React state: at tracking rate, setState
  // would re-render the whole site tens of times a second.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const paint = () => {
      raf = requestAnimationFrame(paint);
      if (hintRef.current) {
        hintRef.current.textContent = HINT[pointRef.current.blockedBy] ?? '';
      }
      if (fpsRef.current) {
        fpsRef.current.textContent = `${statsRef.current?.fps ?? 0}fps`;
      }
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [running, pointRef, statsRef]);

  if (!running) {
    return (
      <div className="gbar">
        <button
          className="gbar-pill"
          onClick={gesture.start}
          disabled={status === 'starting'}
        >
          <span className="gbar-dot" />
          {status === 'starting' ? 'Starting camera…' : 'Control with gestures'}
        </button>
        {error && <p className="gbar-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`gbar open${expanded ? ' tall' : ''}`}>
      {expanded && <HandCanvas landmarksRef={landmarksRef} size={132} />}

      <div className="gbar-row">
        <span className="gbar-dot live" />
        <span className="gbar-hint" ref={hintRef} />
        <span className="gbar-fps" ref={fpsRef} />
      </div>

      <div className="gbar-actions">
        <button onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Hide hand' : 'Show hand'}
        </button>
        <button onClick={gesture.stop}>Turn off</button>
      </div>

      {error && <p className="gbar-error">{error}</p>}
    </div>
  );
}
