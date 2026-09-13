/**
 * Vendors MediaPipe's runtime into public/ so the app has no CDN dependency at
 * run time (the original prototype fetched both from jsdelivr and
 * storage.googleapis.com, and broke wherever those were blocked).
 *
 * These files are large and fully reproducible -- the wasm ships inside the npm
 * package, the model lives at a stable versioned URL -- so they are generated
 * here rather than committed. Runs automatically after `npm install`.
 */
import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const WASM_SRC = join(root, 'node_modules/@mediapipe/tasks-vision/wasm');
const WASM_DEST = join(root, 'public/mediapipe/wasm');
const MODEL_DEST = join(root, 'public/mediapipe/models/hand_landmarker.task');
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

const exists = (p) => stat(p).then(() => true, () => false);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function vendorWasm() {
  if (!(await exists(WASM_SRC))) {
    throw new Error(
      `Missing ${WASM_SRC}. Run "npm install" before this script.`
    );
  }
  await mkdir(WASM_DEST, { recursive: true });
  const files = await readdir(WASM_SRC);
  let copied = 0;
  for (const f of files) {
    await copyFile(join(WASM_SRC, f), join(WASM_DEST, f));
    copied++;
  }
  console.log(`  wasm    ${copied} files -> public/mediapipe/wasm/`);
}

async function vendorModel() {
  if (await exists(MODEL_DEST)) {
    const { size } = await stat(MODEL_DEST);
    console.log(`  model   cached (${mb(size)})`);
    return;
  }
  await mkdir(dirname(MODEL_DEST), { recursive: true });
  console.log('  model   downloading…');
  const res = await fetch(MODEL_URL);
  if (!res.ok) throw new Error(`Model download failed: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(MODEL_DEST));
  const { size } = await stat(MODEL_DEST);
  console.log(`  model   ${mb(size)} -> public/mediapipe/models/`);
}

console.log('Vendoring MediaPipe runtime:');
await vendorWasm();
await vendorModel();
