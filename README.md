# gesture-website

A website controlled by hand gestures through the webcam, with mouse, keyboard
and touch kept working alongside it. Ships to `gesture.logicubeit.com`.

Gesture vocabulary:

| Gesture | Action |
| --- | --- |
| Swipe index finger up / down | Scroll down / up |
| Double-tap index to thumb | Click |
| Pinch, hold ~250ms, then spread / close | Zoom in / out |
| Curl index finger | Neutral return stroke (does not scroll) |

## Status

**Phase 0 — pipeline.** Camera → worker → landmarks, with instrumentation.
Later phases add scroll physics, then gesture input, then the site itself.

## Running it

```bash
npm install   # also vendors the MediaPipe wasm + model into public/
npm run dev
```

Open the printed localhost URL and click *Enable camera*. `localhost` counts as
a secure origin, so `getUserMedia` works without a certificate.

## How it is put together

    src/gesture/          engine -- no React, no DOM assumptions
      worker/             MediaPipe inference, off the main thread
      session.ts          camera ownership + worker plumbing
    src/components/       diagnostics UI
    public/mediapipe/     vendored wasm + model (generated, git-ignored)
    scripts/              vendoring script, runs on postinstall

The engine deliberately avoids React and DOM structure so the same code can be
reused by a browser extension later, where we will not own the page's DOM.

### Why inference runs in a worker

`detectForVideo()` is a synchronous 10–40ms wasm call. Run on the main thread it
starves `requestAnimationFrame` every frame, which is what made the original
prototype's scrolling stutter. Here the main thread only ever receives landmark
payloads, so it stays free to render at the display refresh rate. Inference runs
at ~30Hz and rendering interpolates between results.

### Two things that will bite you

**MediaPipe in a module worker.** MediaPipe loads its wasm glue via
`importScripts()`. In a module worker that function exists but throws, and
MediaPipe's own fallback (`await import()`) loads the UMD glue as an ES module,
leaving `ModuleFactory` module-scoped rather than global — surfacing as
`ModuleFactory not set`. `installImportScripts()` in `vision.worker.ts` replaces
`importScripts` *unconditionally*; a `typeof` guard passes and misses the bug.

**Cross-origin isolation.** COOP/COEP headers enable `SharedArrayBuffer`, which
lets the wasm run multithreaded. Set for dev in `vite.config.ts` and for
production in `public/.htaccess`. Without them everything still works, slower.

## Deploying

`npm run build`, then upload `dist/` to the subdomain's document root.
`public/.htaccess` is copied into the build and carries the COOP/COEP headers,
long-lived caching for the model and wasm, and the SPA fallback rewrite.

HTTPS is required — `getUserMedia` is blocked on insecure origins. Enable the
free Let's Encrypt certificate on the subdomain before testing there.
