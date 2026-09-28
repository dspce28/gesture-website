/**
 * Flick detector behaviour, exercised without a camera.
 *
 * Replays synthetic hand paths through the real detector and checks which of
 * them page the view. The cases that matter are the negatives: a slow drift
 * and a sideways reach must NOT scroll, because those are what a hand does
 * while aiming at something.
 *
 * Run with: npx tsx tests/flick.test.ts
 */
import { FlickDetector } from '../lib/gesture/flick';
import type { HandMetrics } from '../lib/gesture/analysis';

const HAND = 0.2;

const metrics = (x: number, y: number): HandMetrics => ({
  handSize: HAND,
  tip: { x, y, z: 0 },
  elevation: 0,
  indexLength: 0.8,
  othersCurled: true,
  pinch: 1,
  pose: 'point',
});

/** Replay a path. Each leg is [dxPerFrame, dyPerFrame, frames] at ~30fps. */
type Leg = [number, number, number];

function run(legs: Leg[]): number[] {
  const d = new FlickDetector();
  let t = 0;
  let x = 0.5;
  let y = 0.5;
  const fired: number[] = [];
  for (const [dx, dy, frames] of legs) {
    for (let i = 0; i < frames; i++) {
      t += 33;
      x += dx;
      y += dy;
      const st = d.update(metrics(x, y), t);
      if (st.fired !== 0) fired.push(st.fired);
    }
  }
  return fired;
}

const still: Leg = [0, 0, 10];
const pause: Leg = [0, 0, 22];
// hand-widths/s = (delta / handSize) * 30, so 0.02/frame is 3.0 hw/s.
const flickUp: Leg = [0, -0.02, 6];
const flickDown: Leg = [0, 0.02, 6];
const drift: Leg = [0, -0.004, 14];
const reachSideways: Leg = [0.025, -0.008, 6];

const cases: Array<{ name: string; got: number[]; want: number[] }> = [
  { name: 'hand held still', got: run([still]), want: [] },
  { name: 'flick up pages down', got: run([still, flickUp, still]), want: [1] },
  { name: 'flick down pages up', got: run([still, flickDown, still]), want: [-1] },
  { name: 'slow drift is ignored', got: run([still, drift, still]), want: [] },
  { name: 'sideways reach is ignored', got: run([still, reachSideways, still]), want: [] },
  { name: 'return stroke absorbed', got: run([still, flickUp, flickDown, still]), want: [1] },
  { name: 'flick, pause, flick', got: run([still, flickUp, pause, flickUp, still]), want: [1, 1] },
];

let failed = 0;
for (const c of cases) {
  const ok = JSON.stringify(c.got) === JSON.stringify(c.want);
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(26)} got [${c.got.join(',')}]  want [${c.want.join(',')}]`
  );
}

console.log(failed === 0 ? '\nAll flick cases pass.' : `\n${failed} case(s) failed.`);
process.exitCode = failed === 0 ? 0 : 1;
