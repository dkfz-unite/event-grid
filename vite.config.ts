import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2018',
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/vite-entry.ts'),
      name: 'EventGrid',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'event-grid.js';
        if (format === 'cjs') return 'event-grid.cjs';
        return 'event-grid.umd.js';
      },
      cssFileName: 'event-grid'
    },
    rolldownOptions: {
      output: {
        exports: 'default'
      }
    }
  }
});
