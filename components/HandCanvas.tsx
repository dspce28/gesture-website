'use client';

import { useEffect, useRef } from 'react';
import type { Landmark } from '@/lib/gesture/types';

/** MediaPipe's 21-point hand topology, as [from, to] index pairs. */
const BONES: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

interface Props {
  landmarksRef: React.MutableRefObject<Landmark[] | null>;
  size?: number;
}

/**
 * Draws the live hand skeleton. Reads landmarks from a ref inside its own rAF
 * loop rather than taking them as props, so incoming frames never trigger a
 * React re-render -- at 30 fps that would be 30 reconciliations a second for
 * something that is pure canvas painting.
 */
export function HandCanvas({ landmarksRef, size = 260 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const lm = landmarksRef.current;

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#0b0a14';
      ctx.fillRect(0, 0, size, size);

      if (!lm) {
        ctx.fillStyle = '#4b4668';
        ctx.font = '500 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('no hand', size / 2, size / 2);
        return;
      }

      // Mirror x so the preview matches what a mirror would show.
      const px = (p: Landmark) => (1 - p.x) * size;
      const py = (p: Landmark) => p.y * size;

      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      for (const [a, b] of BONES) {
        ctx.beginPath();
        ctx.moveTo(px(lm[a]), py(lm[a]));
        ctx.lineTo(px(lm[b]), py(lm[b]));
        ctx.stroke();
      }

      ctx.fillStyle = '#ff5a36';
      for (const p of lm) {
        ctx.beginPath();
        ctx.arc(px(p), py(p), 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight the two points every gesture in our vocabulary depends on.
      ctx.strokeStyle = '#3ddc84';
      ctx.lineWidth = 2;
      for (const i of [4, 8]) {
        ctx.beginPath();
        ctx.arc(px(lm[i]), py(lm[i]), 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [landmarksRef, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, borderRadius: 12, display: 'block' }}
    />
  );
}
