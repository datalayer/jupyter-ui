/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';

// Vite config for serving the examples folder in development
export default defineConfig({
  root: 'examples',
  plugins: [
    react(),
    treatAsCommonjs(),
    {
      name: 'raw-css-as-string',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (source.endsWith('.raw.css') && !source.includes('?raw')) {
          const resolved = await this.resolve(source + '?raw', importer, {
            skipSelf: true,
          });
          if (resolved) return resolved.id;
          return null;
        }
        return null;
      },
    },
    {
      name: 'fix-text-query',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (source.includes('?text')) {
          const fixed = source.replace('?text', '?raw');
          const resolved = await this.resolve(fixed, importer, {
            skipSelf: true,
          });
          if (resolved) return resolved.id;
          return fixed;
        }
        return null;
      },
    },
  ],
  assetsInclude: ['**/*.whl', '**/*.raw.css'],
  resolve: {
    alias: [
      {
        find: /^~(.*)$/,
        replacement: '$1',
      },
    ],
  },
  define: {
    global: 'globalThis',
    __webpack_public_path__: '""',
  },
  server: {
    port: 3456,
    open: true,
  },
});
