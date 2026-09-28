'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GestureSession, type SessionStats } from '@/lib/gesture/session';
import type { Landmark } from '@/lib/gesture/types';
import { HandCanvas } from './HandCanvas';

type Status = 'idle' | 'starting' | 'running' | 'error';

/**
 * Phase 0 harness.
 *
 * Its only job is to prove the pipeline: camera -> worker -> landmarks, with
 * enough instrumentation to see whether the main thread is actually free.
 * The main-thread rAF counter is the number that matters -- if inference were
 * still blocking the main thread (the original POC's defect), it would sag
 * toward the inference rate instead of sitting at the display refresh rate.
 */
export function PipelineCheck() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [uiFps, setUiFps] = useState(0);

  const sessionRef = useRef<GestureSession | null>(null);
  const landmarksRef = useRef<Landmark[] | null>(null);

  // Main-thread frame rate, measured independently of the vision pipeline.
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let windowStart = performance.now();

    const tick = () => {
      raf = requestAnimationFrame(tick);
      frames++;
      const now = performance.now();
      if (now - windowStart >= 1000) {
        setUiFps(Math.round((frames * 1000) / (now - windowStart)));
        frames = 0;
        windowStart = now;
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => () => sessionRef.current?.stop(), []);

  const start = useCallback(async () => {
    setStatus('starting');
    setError(null);

    const session = new GestureSession({
      targetFps: 30,
      onReady: (s) => {
        setStats(s);
        setStatus('running');
      },
      onFrame: (frame, s) => {
        // Landmarks go into a ref, not state: 30 renders/sec would be waste.
        landmarksRef.current = frame.landmarks;
        setStats(s);
      },
      onError: (message, fatal) => {
        setError(message);
        if (fatal) setStatus('error');
      },
    });

    sessionRef.current = session;
    await session.start();
  }, []);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    landmarksRef.current = null;
    setStatus('idle');
    setStats(null);
  }, []);

  return (
    <main className="wrap">
      <header>
        <p className="eyebrow">Phase 0 · pipeline check</p>
        <h1>Gesture engine</h1>
        <p className="lead">
          Camera frames are decoded and run through MediaPipe inside a worker.
          The main thread only receives landmarks, so its frame rate should stay
          pinned at your display refresh even while inference runs.
        </p>
      </header>

      <div className="panel">
        <HandCanvas landmarksRef={landmarksRef} />

        <dl className="stats">
          <Stat label="main thread" value={`${uiFps} fps`} good={uiFps >= 55} />
          <Stat
            label="inference"
            value={stats ? `${stats.fps} fps` : '—'}
            good={(stats?.fps ?? 0) >= 20}
          />
          <Stat
            label="inference cost"
            value={stats ? `${stats.inferenceMs.toFixed(1)} ms` : '—'}
          />
          <Stat label="delegate" value={stats?.delegate ?? '—'} />
          <Stat label="capture" value={stats?.captureMode ?? '—'} />
          <Stat
            label="model load"
            value={stats ? `${(stats.loadMs / 1000).toFixed(2)} s` : '—'}
          />
        </dl>
      </div>

      <div className="actions">
        {status === 'running' ? (
          <button className="btn ghost" onClick={stop}>
            Stop camera
          </button>
        ) : (
          <button
            className="btn"
            onClick={start}
            disabled={status === 'starting'}
          >
            {status === 'starting' ? 'Starting…' : 'Enable camera'}
          </button>
        )}
      </div>

      {error && <p className="error">{error}</p>}
    </main>
  );
}

function Stat({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className={good === undefined ? '' : good ? 'ok' : 'warn'}>{value}</dd>
    </div>
  );
}
