'use client';

import { useEffect, useRef, useState } from 'react';
import { useGesture } from './GestureProvider';
import { HandCanvas } from './HandCanvas';

/** What the engine is waiting for, phrased as something to do about it. */
const HINT: Record<string, string> = {
  none: 'paging',
  pose: 'curl your other fingers',
  slow: 'flick up or down to turn the page',
  sideways: 'move straight up or down',
  cooling: 'ready…',
  'no-hand': 'show your hand',
};

/**
 * The site-wide gesture control. A pill until enabled, then a small panel with
 * live state and the hand preview.
 *
 * Deliberately never a requirement: the site works identically with mouse,
 * keyboard and touch. Camera permission gets denied, rooms are dark, webcams
 * get covered — gesture is an alternative input, not the only one.
 */
export function GestureBar() {
  const { gesture } = useGesture();
  const { status, error, flickStateRef, statsRef, landmarksRef } = gesture;
  const running = status === 'running';

  const [expanded, setExpanded] = useState(false);
  const hintRef = useRef<HTMLSpanElement>(null);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  // Painted from refs, never React state: at tracking rate, setState here
  // would re-render the entire site tens of times a second.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const paint = () => {
      raf = requestAnimationFrame(paint);
      const f = flickStateRef.current;
      if (hintRef.current) hintRef.current.textContent = HINT[f.blockedBy] ?? '';
      if (dotRef.current) {
        dotRef.current.classList.toggle('firing', f.cooling);
      }
      if (fpsRef.current) {
        fpsRef.current.textContent = `${statsRef.current?.fps ?? 0}fps`;
      }
    };
    raf = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(raf);
  }, [running, flickStateRef, statsRef]);

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
        <span className="gbar-dot live" ref={dotRef} />
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
