/**
 * Ambient declarations for the Insertable Streams API, which TypeScript's DOM
 * lib does not ship yet. Chromium-only; guarded at runtime by
 * detectCaptureMode() before any of this is touched.
 */
export {};

declare global {
  interface MediaStreamTrackProcessorInit {
    track: MediaStreamTrack;
    maxBufferSize?: number;
  }

  interface MediaStreamTrackProcessor<T = VideoFrame> {
    readonly readable: ReadableStream<T>;
  }

  /** Declared as a var so `globalThis.MediaStreamTrackProcessor` type-checks. */
  var MediaStreamTrackProcessor: {
    prototype: MediaStreamTrackProcessor;
    new <T = VideoFrame>(
      init: MediaStreamTrackProcessorInit
    ): MediaStreamTrackProcessor<T>;
  };
}
