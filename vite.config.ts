import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

export default defineConfig({
  plugins: [crx({ manifest })],
  server: {
    // Vite 5+ blocks cross-origin fetches from chrome-extension:// by default.
    // Required for CRXJS HMR to reach the dev server from the service worker.
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {},
    },
  },
});
