/**
 * Vision worker.
 *
 * Everything expensive lives here: wasm load, model load, and the synchronous
 * detectForVideo() call that blocked the main thread in the original POC.
 * The main thread receives only landmark payloads, so its rAF loop is free to
 * run at the display refresh rate no matter how slow inference is.
 */
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { Delegate, HandFrame, Handedness, Landmark } from '../types';
import type { MainToWorker, WorkerToMain } from './protocol';

/**
 * Worker global, typed locally. Pulling in the "webworker" lib would collide
 * with the "DOM" lib the rest of the app compiles against, so we narrow `self`
 * down to just the surface this file actually uses.
 */
const ctx = self as unknown as {
  postMessage(msg: WorkerToMain, transfer?: Transferable[]): void;
  onmessage: ((ev: MessageEvent<MainToWorker>) => void) | null;
};

let landmarker: HandLandmarker | null = null;
let delegate: Delegate = 'CPU';
let targetFps = 30;
let running = false;

/** detectForVideo() demands strictly increasing timestamps; we guarantee it. */
let lastStamp = -1;

// Throttling + telemetry
let nextDueAt = 0;
let dropped = 0;
let frameCount = 0;
let fpsWindowAt = 0;
let fps = 0;

function post(msg: WorkerToMain, transfer: Transferable[] = []) {
  ctx.postMessage(msg, transfer);
}

function fail(message: string, fatal = true) {
  post({ type: 'error', message, fatal });
}

/**
 * Make MediaPipe's wasm glue loadable inside a module worker.
 *
 * MediaPipe loads the glue with importScripts(). In a module worker that
 * function still *exists* but throws TypeError when called, and MediaPipe
 * catches exactly that and retries with `await import(url)`. The glue is a UMD
 * script, so importing it as an ES module leaves `ModuleFactory` bound at
 * module scope instead of on globalThis -- where MediaPipe then looks for it
 * and fails with "ModuleFactory not set".
 *
 * So we replace importScripts unconditionally (not just when it is missing --
 * that check passes and is precisely the trap). Synchronous XHR is supported
 * in workers and matches importScripts' blocking semantics; indirect eval runs
 * the glue in global scope, which is what puts ModuleFactory where it belongs.
 *
 * Note: this needs 'unsafe-eval' if a Content-Security-Policy is ever added.
 */
function installImportScripts() {
  const g = self as unknown as Record<string, unknown>;

  g.importScripts = (...urls: string[]) => {
    for (const url of urls) {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send();
      if (xhr.status >= 400) {
        throw new Error(`importScripts failed: ${url} (${xhr.status})`);
      }
      (0, eval)(xhr.responseText);
    }
  };
}

async function init(wasmPath: string, modelPath: string, fpsCap: number) {
  targetFps = fpsCap;
  const startedAt = performance.now();

  installImportScripts();
  const fileset = await FilesetResolver.forVisionTasks(wasmPath);

  // GPU is markedly faster but unavailable on some drivers; fall back silently.
  const build = (d: Delegate) =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: modelPath, delegate: d },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

  try {
    landmarker = await build('GPU');
    delegate = 'GPU';
  } catch {
    landmarker = await build('CPU');
    delegate = 'CPU';
  }

  post({ type: 'ready', delegate, loadMs: performance.now() - startedAt });
}

/** Run the model on one image source and publish the result. */
function infer(source: TexImageSource, tMs: number) {
  if (!landmarker) return;

  const stamp = Math.max(tMs, lastStamp + 1);
  lastStamp = stamp;

  const t0 = performance.now();
  let result;
  try {
    result = landmarker.detectForVideo(source, stamp);
  } catch (e) {
    fail(`Inference failed: ${(e as Error).message}`, false);
    return;
  }
  const inferenceMs = performance.now() - t0;

  const raw = result.landmarks?.[0];
  const landmarks: Landmark[] | null = raw
    ? raw.map((p) => ({ x: p.x, y: p.y, z: p.z }))
    : null;

  const handedness =
    (result.handedness?.[0]?.[0]?.categoryName as Handedness) ?? 'Unknown';

  // FPS over a rolling one-second window.
  frameCount++;
  const now = performance.now();
  if (now - fpsWindowAt >= 1000) {
    fps = Math.round((frameCount * 1000) / (now - fpsWindowAt));
    frameCount = 0;
    fpsWindowAt = now;
  }

  const frame: HandFrame = { t: stamp, landmarks, handedness, inferenceMs };
  post({ type: 'frame', frame, fps, dropped });
  dropped = 0;
}

/**
 * Drain the camera's VideoFrame stream.
 *
 * Two rules matter here. Every VideoFrame must be close()d or the capture
 * pipeline stalls after a handful of frames. And we deliberately run inference
 * below camera rate: the main thread interpolates between results, so paying
 * for 60Hz inference buys nothing but heat.
 */
async function consume(stream: ReadableStream) {
  const reader = (stream as ReadableStream<VideoFrame>).getReader();
  const minInterval = 1000 / targetFps;
  running = true;

  try {
    while (running) {
      const { done, value: videoFrame } = await reader.read();
      if (done) break;
      if (!videoFrame) continue;

      const now = performance.now();
      if (now < nextDueAt) {
        dropped++;
        videoFrame.close();
        continue;
      }
      nextDueAt = now + minInterval;

      try {
        infer(videoFrame, now);
      } finally {
        videoFrame.close();
      }
    }
  } catch (e) {
    if (running) fail(`Frame stream: ${(e as Error).message}`);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* already released */
    }
    post({ type: 'stopped' });
  }
}

ctx.onmessage = async (ev: MessageEvent<MainToWorker>) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case 'init':
        await init(msg.wasmPath, msg.modelPath, msg.targetFps);
        break;

      case 'start-stream':
        void consume(msg.stream);
        break;

      case 'push-bitmap': {
        // Fallback path: throttling already happened on the main thread.
        try {
          infer(msg.bitmap, msg.t);
        } finally {
          msg.bitmap.close();
        }
        break;
      }

      case 'stop':
        running = false;
        landmarker?.close();
        landmarker = null;
        break;
    }
  } catch (e) {
    fail((e as Error).message ?? String(e));
  }
};
