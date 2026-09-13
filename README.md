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

**Phase 2 — point to scroll.** Point the index finger up to scroll up, down
to scroll down, and hold the direction. The gesture layer measures a hand and
hands a velocity to the Phase 1 engine; it implements no scrolling of its own.

**Phase 1 — scroll physics.** Momentum scrolling driven by wheel and keyboard,
with a live tuning HUD. No camera involved: tuning feel and debugging hand
tracking at the same time makes it impossible to tell which layer is stuttering.

**Phase 0 — pipeline.** Camera → worker → landmarks, with instrumentation.

Next: double-tap to click, then pinch-hold to zoom.

## Running it

```bash
npm install   # also vendors the MediaPipe wasm + model into public/
npm run dev
```

Open the printed localhost URL. Two dev views: **Scroll feel** (default) and
**Pipeline** (`#pipeline`), which needs a camera. `localhost` counts as
a secure origin, so `getUserMedia` works there without a certificate.

## How it is put together

    src/gesture/          engine -- no React, no DOM assumptions
      worker/             MediaPipe inference, off the main thread
      session.ts          camera ownership + worker plumbing
    src/scroll/           physics, scroller backends, rAF loop
    src/react/            hooks binding the two together
    src/components/       diagnostics and tuning UI
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

### Pointing, not swiping

The gesture is a held direction, not a flick. Watching a recording of it being
performed settled the question: each direction was held steady for one to two
seconds with the hand barely translating, so a velocity detector saw only the
brief transition between poses and nothing during the hold. The page moved in
jerks and then stopped.

Holding also dissolves the return-stroke problem a swipe model has to solve.
There is no return stroke: you do not swipe back, you stop pointing.

The signal is the sine of the index finger's angle, measured knuckle to tip and
divided by finger length. Against a real session it separates cleanly:
+0.87..+0.94 pointing up, -0.18..-0.57 pointing down.

One trap worth recording. The obvious "is the index extended" test -- tip
further from the wrist than the middle joint -- reports *curled* whenever the
finger points downward, because the finger foreshortens as it angles toward the
camera. Used as a gate it rejected the entire scroll-down gesture. The
dependable gate is the other three fingers being curled, which measured 3 of 3
on every frame of that session.

### Keep telemetry off the main thread too

The first gesture build scrolled at 16–28fps despite inference being in a
worker. The cause was the instrumentation: HUD values held in React state meant
a re-render of the whole page on every scroll frame and every tracked frame.
The numbers reporting on the main thread were the thing saturating it.

HUD components now read live values from refs inside their own paint loop and
write to the DOM directly. React state is reserved for discrete, low-frequency
facts like status and error text. The same rule applies to any scroll-linked
effect added later.
