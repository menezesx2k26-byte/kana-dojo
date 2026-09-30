import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'features/Geometry/**/*.test.ts',
      'features/Geometry/**/*.test.tsx',
    ],
    pool: 'forks',
    maxWorkers: 2,
  },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '..') } },
  esbuild: { jsx: 'automatic' },
});
