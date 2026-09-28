/**
 * Turns raw landmarks into the handful of measurements our gesture vocabulary
 * needs. Everything is scale-free -- divided by hand size or finger length --
 * so distance from the camera does not change behaviour.
 */
import { LM, type Landmark } from './types';

export type Pose =
  /** Index out, other fingers curled. The scrolling pose, in any direction. */
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
  /**
   * Sine of the index finger's angle above horizontal, in [-1, 1].
   * +1 straight up, 0 horizontal, -1 straight down.
   *
   * This is the signal the scroll gesture runs on, and it separates cleanly:
   * measured against a real recording, pointing up reads +0.87..+0.94 and
   * pointing down reads -0.18..-0.57, with transitions passing through in
   * under half a second.
   */
  elevation: number;
  /**
   * Index finger length over hand size. Drops when the finger points toward
   * the camera and its 2D projection foreshortens, so a low value means the
   * direction reading is unreliable, not that the finger is folded.
   */
  indexLength: number;
  /**
   * Middle, ring and pinky all curled. Measured 3/3 on every frame of a real
   * pointing session, which makes this the dependable gate for "the hand is
   * in the scrolling pose".
   */
  othersCurled: boolean;
  /** Thumb-to-index distance in hand widths. Small = pinched. */
  pinch: number;
  pose: Pose;
}

const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * A finger is extended when its tip sits further from the wrist than its middle
 * joint does.
 *
 * Note this is only trustworthy for the middle, ring and pinky. Applied to the
 * index it reports "curled" whenever the finger points downward or toward the
 * camera -- which rejected the entire scroll-down gesture when it was used as a
 * gate. Index direction is read from `elevation` instead.
 */
function extended(lm: Landmark[], pip: number, tip: number, slack = 1.1) {
  return dist(lm[LM.WRIST], lm[tip]) > dist(lm[LM.WRIST], lm[pip]) * slack;
}

export function analyze(lm: Landmark[]): HandMetrics {
  const handSize = dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP]) || 1e-6;

  const fingerLen = dist(lm[LM.INDEX_MCP], lm[LM.INDEX_TIP]) || 1e-6;
  // Image y grows downward, so subtracting tip from knuckle makes up positive.
  const elevation = Math.max(
    -1,
    Math.min(1, (lm[LM.INDEX_MCP].y - lm[LM.INDEX_TIP].y) / fingerLen)
  );

  const middle = extended(lm, LM.MIDDLE_PIP, LM.MIDDLE_TIP);
  const ring = extended(lm, LM.RING_PIP, LM.RING_TIP);
  const pinky = extended(lm, LM.PINKY_PIP, LM.PINKY_TIP);
  const othersCurled = !middle && !ring && !pinky;

  const pinch = dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / handSize;
  const indexLength = fingerLen / handSize;

  let pose: Pose = 'other';
  if (pinch < 0.25) pose = 'pinch';
  else if (othersCurled) pose = 'point';
  else if (middle && ring && pinky) pose = 'open';

  return {
    handSize,
    tip: lm[LM.INDEX_TIP],
    elevation,
    indexLength,
    othersCurled,
    pinch,
    pose,
  };
}
