/**
 * Core gesture types. Deliberately DOM-free and framework-free: this module
 * must compile unchanged inside the future browser extension, where we do not
 * own the page's DOM.
 */

/** A single hand landmark in normalised image space (0..1), z relative to wrist. */
export interface Landmark {
  x: number;
  y: number;
  z: number;
}

/** MediaPipe hand landmark indices we care about, named for readability. */
export const LM = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_TIP: 20,
} as const;

/** Which hand the model thinks it saw. */
export type Handedness = 'Left' | 'Right' | 'Unknown';

/** One inference result, as produced by the worker. */
export interface HandFrame {
  /** Monotonic ms timestamp (performance.now() domain on the worker clock). */
  t: number;
  /** 21 landmarks, or null when no hand is present in the frame. */
  landmarks: Landmark[] | null;
  handedness: Handedness;
  /** Inference wall time in ms, for the perf HUD. */
  inferenceMs: number;
}

/** Which execution path the vision worker actually got. */
export type Delegate = 'GPU' | 'CPU';

/** How camera frames reach the worker. */
export type CaptureMode =
  /** Chromium: MediaStreamTrackProcessor, frames never touch the main thread. */
  | 'track-processor'
  /** Safari/Firefox fallback: main-thread grab + ImageBitmap transfer. */
  | 'bitmap-pump';
