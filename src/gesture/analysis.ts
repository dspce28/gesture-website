/**
 * Turns raw landmarks into the handful of measurements our gesture vocabulary
 * actually needs. Everything here is scale-invariant: divided by hand size, so
 * leaning toward or away from the camera does not change sensitivity.
 */
import { LM, type Landmark } from './types';

export type Pose =
  /** Index extended, other fingers curled. The scrolling pose. */
  | 'point'
  /** All fingers extended. Rest / neutral. */
  | 'open'
  /** Thumb and index tips together. */
  | 'pinch'
  | 'other';

export interface HandMetrics {
  /** Wrist to middle knuckle, in normalised image units. The scale reference. */
  handSize: number;
  /** Index fingertip, normalised image coords. */
  tip: Landmark;
  indexExtended: boolean;
  othersCurled: boolean;
  /** Thumb-to-index distance in hand widths. Small = pinched. */
  pinch: number;
  pose: Pose;
}

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * A finger is extended when its tip sits further from the wrist than its middle
 * joint does. Cheap, and far more robust to hand rotation than joint angles.
 */
function extended(lm: Landmark[], pip: number, tip: number, slack = 1.1) {
  return dist(lm[LM.WRIST], lm[tip]) > dist(lm[LM.WRIST], lm[pip]) * slack;
}

export function analyze(lm: Landmark[]): HandMetrics {
  const handSize = dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 1e-6;

  const indexExtended = extended(lm, LM.INDEX_PIP, LM.INDEX_TIP);
  const middle = extended(lm, LM.MIDDLE_PIP, LM.MIDDLE_TIP);
  const ring = extended(lm, LM.RING_PIP, LM.RING_TIP);
  const pinky = extended(lm, LM.PINKY_PIP, LM.PINKY_TIP);
  const othersCurled = !middle && !ring && !pinky;

  const pinch = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handSize;

  let pose: Pose = 'other';
  if (pinch < 0.32) pose = 'pinch';
  else if (indexExtended && othersCurled) pose = 'point';
  else if (indexExtended && middle && ring && pinky) pose = 'open';

  return {
    handSize,
    tip: lm[LM.INDEX_TIP],
    indexExtended,
    othersCurled,
    pinch,
    pose,
  };
}
