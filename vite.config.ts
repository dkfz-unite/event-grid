import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import MagicString from 'magic-string';

function d3V3GlobalContext(): Plugin {
  return {
    name: 'd3-v3-global-context',
    enforce: 'pre',
    transform(code, id) {
      if (!id.includes('/node_modules/d3/d3.js')) return null;

      const invocation = code.lastIndexOf('}();');
      if (invocation === -1) {
        throw new Error('Unable to locate the D3 v3 global invocation');
      }

      // D3 v3 reads `this.document`; native ESM has no top-level `this`.
      const transformed = new MagicString(code);
      transformed.overwrite(invocation, invocation + 4, '}.call(globalThis);');
      return {
        code: transformed.toString(),
        map: transformed.generateMap({ hires: true, source: id, includeContent: true })
      };
    }
  };
}

export default defineConfig({
  optimizeDeps: {
    needsInterop: ['d3'],
    rolldownOptions: {
      plugins: [d3V3GlobalContext()]
    }
  },
  plugins: [d3V3GlobalContext()],
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
