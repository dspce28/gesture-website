import type { NextConfig } from 'next';

/**
 * Cross-origin isolation unlocks SharedArrayBuffer, which lets MediaPipe's wasm
 * run multithreaded — a large win on the CPU delegate.
 *
 * This is also set in public/.htaccess for an Apache host such as Hostinger,
 * but that file means nothing to Vercel, so the headers have to be declared
 * here too or the deployed site quietly falls back to single-threaded wasm.
 *
 * Safe because every asset is same-origin: the wasm and model are vendored into
 * public/, and next/font self-hosts the typefaces at build time.
 */
const crossOriginIsolation = [
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: crossOriginIsolation,
      },
      {
        // The model and wasm runtime are versioned and never change in place.
        source: '/mediapipe/:path*',
        headers: [
          ...crossOriginIsolation,
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
