/**
 * Tap detector behaviour, exercised without a camera.
 *
 * Replays synthetic pinch sequences through the real detector. The negatives
 * matter most: a hand pointing downward measures a pinch ratio around 0.38,
 * and if that ever registered as closed the page would click itself while you
 * were only scrolling.
 *
 * Run with: npx tsx tests/tap.test.ts
 */
import { TapDetector } from '../lib/gesture/tap';

/** One step of a pinch sequence: [pinchRatio, msSincePreviousStep]. */
type Step = [number, number];

function run(steps: Step[]): number[] {
  const d = new TapDetector();
  let t = 0;
  const fired: number[] = [];
  for (const [pinch, dt] of steps) {
    t += dt;
    const st = d.update(pinch, t);
    if (st.fired !== 0) fired.push(st.fired);
  }
  return fired;
}

const OPEN = 0.5;
const SHUT = 0.08;

/** A complete tap: closes, then reopens after `closedMs`. */
const tap = (closedMs = 90): Step[] => [[SHUT, closedMs], [OPEN, 30]];
/** Idle time with the hand open. */
const wait = (ms: number): Step[] => [[OPEN, ms]];

const cases: Array<{ name: string; got: number[]; want: number[] }> = [
  { name: 'single tap clicks', got: run([...tap()]), want: [1] },
  {
    name: 'double tap: click + dblclick',
    got: run([...tap(), ...wait(160), ...tap()]),
    want: [1, 2],
  },
  {
    name: 'taps too far apart = 2 singles',
    got: run([...tap(), ...wait(900), ...tap()]),
    want: [1, 1],
  },
  {
    name: 'long hold is zoom, not a tap',
    got: run([[SHUT, 50], [SHUT, 600], [OPEN, 30]]),
    want: [],
  },
  {
    name: 'triple tap does not chain doubles',
    got: run([...tap(), ...wait(160), ...tap(), ...wait(160), ...tap()]),
    want: [1, 2, 1],
  },
  {
    name: 'pointing-down pinch (0.38) never clicks',
    got: run([[0.38, 50], [0.38, 200], [0.38, 200], [0.38, 200]]),
    want: [],
  },
  {
    name: 'hovering at the threshold does not chatter',
    got: run([[0.25, 50], [0.3, 50], [0.25, 50], [0.3, 50], [0.25, 50]]),
    want: [],
  },
  {
    // A fingertip touch does not reliably approach zero: the ratio divides by
    // hand size, so this is the realistic value a real tap has to clear.
    name: 'a shallow but real tap (0.18) clicks',
    got: run([[0.18, 90], [OPEN, 30]]),
    want: [1],
  },
];

let failed = 0;
for (const c of cases) {
  const ok = JSON.stringify(c.got) === JSON.stringify(c.want);
  if (!ok) failed++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(34)} got [${c.got.join(',')}]  want [${c.want.join(',')}]`
  );
}

console.log(failed === 0 ? '\nAll tap cases pass.' : `\n${failed} case(s) failed.`);
process.exitCode = failed === 0 ? 0 : 1;
