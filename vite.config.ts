import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Cross-origin isolation unlocks SharedArrayBuffer, which lets MediaPipe's
 * wasm run multithreaded -- a large win on the CPU delegate. Safe here because
 * every asset (wasm, model, fonts) is self-hosted; nothing cross-origin loads.
 * The production equivalent goes in .htaccess on Hostinger.
 */
const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react()],
  server: { headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
  // Module workers, matching what Vite's dev server serves, so dev and prod
  // exercise the same code path. The worker patches importScripts itself so
  // MediaPipe's UMD wasm glue still loads correctly. See vision.worker.ts.
  worker: { format: 'es' },
  build: {
    target: 'esnext',
    // The .task model is large and immutable; keep it out of the JS graph.
    assetsInlineLimit: 0,
  },
});
