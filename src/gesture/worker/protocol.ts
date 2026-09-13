/**
 * Typed message protocol between the main thread and the vision worker.
 * Every message is discriminated on `type` so both sides stay exhaustive.
 */
import type { CaptureMode, Delegate, HandFrame } from '../types';

export interface WorkerInit {
  type: 'init';
  /** Absolute URL of the directory holding the MediaPipe wasm files. */
  wasmPath: string;
  /** Absolute URL of the hand_landmarker .task model. */
  modelPath: string;
  /** Upper bound on inference rate. Frames arriving faster are dropped. */
  targetFps: number;
}

/** Chromium path: a transferred stream of VideoFrames. */
export interface WorkerStartStream {
  type: 'start-stream';
  stream: ReadableStream;
}

/** Fallback path: one ImageBitmap pumped from the main thread. */
export interface WorkerPushBitmap {
  type: 'push-bitmap';
  bitmap: ImageBitmap;
  t: number;
}

export interface WorkerStop {
  type: 'stop';
}

export type MainToWorker =
  | WorkerInit
  | WorkerStartStream
  | WorkerPushBitmap
  | WorkerStop;

export interface WorkerReady {
  type: 'ready';
  delegate: Delegate;
  /** Model + wasm load time in ms. */
  loadMs: number;
}

export interface WorkerFrame {
  type: 'frame';
  frame: HandFrame;
  /** Inference FPS, averaged over the last second. */
  fps: number;
  /** Camera frames dropped since the last report, because of throttling. */
  dropped: number;
}

export interface WorkerError {
  type: 'error';
  message: string;
  fatal: boolean;
}

export interface WorkerStopped {
  type: 'stopped';
}

export type WorkerToMain =
  | WorkerReady
  | WorkerFrame
  | WorkerError
  | WorkerStopped;

/** Feature detection, kept here so the worker and host agree on one answer. */
export function detectCaptureMode(): CaptureMode {
  return typeof globalThis.MediaStreamTrackProcessor === 'function'
    ? 'track-processor'
    : 'bitmap-pump';
}
