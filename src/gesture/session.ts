/**
 * Main-thread orchestrator: owns camera permission, wires the stream into the
 * worker, and re-publishes results. Holds no DOM references, so the future
 * extension can reuse it verbatim.
 */
import type { CaptureMode, Delegate, HandFrame } from './types';
import VisionWorker from './worker/vision.worker?worker';
import { detectCaptureMode } from './worker/protocol';
import type { MainToWorker, WorkerToMain } from './worker/protocol';

export interface SessionStats {
  fps: number;
  inferenceMs: number;
  dropped: number;
  delegate: Delegate;
  captureMode: CaptureMode;
  loadMs: number;
}

export interface SessionOptions {
  targetFps?: number;
  onFrame: (frame: HandFrame, stats: SessionStats) => void;
  onError: (message: string, fatal: boolean) => void;
  onReady: (stats: SessionStats) => void;
}

const WASM_PATH = new URL('/mediapipe/wasm', location.origin).href;
const MODEL_PATH = new URL(
  '/mediapipe/models/hand_landmarker.task',
  location.origin
).href;

export class GestureSession {
  private worker: Worker | null = null;
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private pumpTimer = 0;
  private readonly opts: Required<Pick<SessionOptions, 'targetFps'>> &
    SessionOptions;

  private stats: SessionStats = {
    fps: 0,
    inferenceMs: 0,
    dropped: 0,
    delegate: 'CPU',
    captureMode: detectCaptureMode(),
    loadMs: 0,
  };

  constructor(opts: SessionOptions) {
    this.opts = { targetFps: 30, ...opts };
  }

  get captureMode(): CaptureMode {
    return this.stats.captureMode;
  }

  async start(): Promise<void> {
    if (this.worker) return;

    // getUserMedia is unavailable on insecure origins; say so plainly rather
    // than letting it surface as a confusing NotAllowedError.
    if (!window.isSecureContext) {
      this.opts.onError(
        'Camera needs HTTPS (or localhost). This page is on an insecure origin.',
        true
      );
      return;
    }

    // Built via Vite's ?worker import so dev and production agree on the output
    // format. That format is classic (iife), deliberately: MediaPipe's wasm
    // loader reaches for importScripts(), which a module worker does not
    // provide -- the symptom is "ModuleFactory not set" at model-load time.
    this.worker = new VisionWorker();
    this.worker.onmessage = (ev: MessageEvent<WorkerToMain>) =>
      this.handle(ev.data);
    this.worker.onerror = (ev) =>
      this.opts.onError(`Worker failed: ${ev.message}`, true);

    this.send({
      type: 'init',
      wasmPath: WASM_PATH,
      modelPath: MODEL_PATH,
      targetFps: this.opts.targetFps,
    });

    try {
      // Inference cost scales with pixel count, and hand landmarks do not need
      // resolution -- 480x360 tracks just as well as 720p and costs a third as
      // much. Frame rate is capped at the inference rate too: decoding 60fps
      // when we sample 30 is pure waste, and both compete for the same GPU.
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 480 },
          height: { ideal: 360 },
          frameRate: { ideal: this.opts.targetFps, max: this.opts.targetFps },
        },
        audio: false,
      });
    } catch (e) {
      const err = e as DOMException;
      this.opts.onError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Gesture control is off; everything else still works.'
          : `Camera unavailable: ${err.message}`,
        true
      );
      return;
    }

    if (this.stats.captureMode === 'track-processor') {
      this.startTrackProcessor();
    } else {
      await this.startBitmapPump();
    }
  }

  /** Chromium: hand the worker a stream of VideoFrames and get out of the way. */
  private startTrackProcessor() {
    const track = this.stream!.getVideoTracks()[0];
    const processor = new MediaStreamTrackProcessor({ track });
    const readable = processor.readable;
    this.worker!.postMessage({ type: 'start-stream', stream: readable }, [
      readable as unknown as Transferable,
    ]);
  }

  /**
   * Safari/Firefox: no MediaStreamTrackProcessor, so the main thread has to
   * grab frames. createImageBitmap is async and the bitmap is transferred, so
   * the main thread still never runs inference -- it only copies pixels.
   */
  private async startBitmapPump() {
    const video = document.createElement('video');
    video.srcObject = this.stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
    this.video = video;

    const interval = 1000 / this.opts.targetFps;
    let busy = false;

    this.pumpTimer = window.setInterval(async () => {
      if (busy || !this.worker || video.readyState < 2) return;
      busy = true;
      try {
        const bitmap = await createImageBitmap(video);
        this.worker.postMessage(
          { type: 'push-bitmap', bitmap, t: performance.now() },
          [bitmap]
        );
      } catch {
        /* transient decode hiccup; next tick will retry */
      } finally {
        busy = false;
      }
    }, interval);
  }

  private handle(msg: WorkerToMain) {
    switch (msg.type) {
      case 'ready':
        this.stats = {
          ...this.stats,
          delegate: msg.delegate,
          loadMs: msg.loadMs,
        };
        this.opts.onReady(this.stats);
        break;

      case 'frame':
        this.stats = {
          ...this.stats,
          fps: msg.fps,
          dropped: msg.dropped,
          inferenceMs: msg.frame.inferenceMs,
        };
        this.opts.onFrame(msg.frame, this.stats);
        break;

      case 'error':
        this.opts.onError(msg.message, msg.fatal);
        break;

      case 'stopped':
        break;
    }
  }

  private send(msg: MainToWorker, transfer: Transferable[] = []) {
    this.worker?.postMessage(msg, transfer);
  }

  stop() {
    if (this.pumpTimer) {
      clearInterval(this.pumpTimer);
      this.pumpTimer = 0;
    }
    this.send({ type: 'stop' });
    this.worker?.terminate();
    this.worker = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.video?.remove();
    this.video = null;
  }
}
