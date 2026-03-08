/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@synapse/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@synapse/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@synapse/ui/tokens': path.resolve(__dirname, '../../packages/ui/src/tokens/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
