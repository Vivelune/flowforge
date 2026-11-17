import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@flowforge/db': path.resolve(__dirname, '../../packages/db/src/index.ts'),
      '@flowforge/engine': path.resolve(__dirname, '../../packages/engine/src/index.ts'),
      '@flowforge/events': path.resolve(__dirname, '../../packages/events/src/index.ts'),
    },
  },
});
