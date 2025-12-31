/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inject CSS into JS bundle for single-file distribution
    cssInjectedByJsPlugin(),
    {
      name: 'raw-css-as-string',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (source.endsWith('.raw.css') && !source.includes('?raw')) {
          // rewrite import to append ?raw query
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
          if (resolved) {
            return resolved.id;
          }
          return fixed;
        }
        return null;
      },
    },
  ],
  assetsInclude: ['**/*.whl', '**/*.raw.css'],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'JupyterEmbed',
      formats: ['es', 'umd', 'iife'],
      fileName: format => {
        if (format === 'iife') return 'jupyter-embed.js';
        if (format === 'umd') return 'jupyter-embed.umd.js';
        return 'jupyter-embed.esm.js';
      },
    },
    rollupOptions: {
      // Don't externalize anything for the browser bundle
      external: [],
      output: {
        // Global variable name for IIFE/UMD builds
        name: 'JupyterEmbed',
        // Ensure CSS is bundled
        assetFileNames: 'jupyter-embed.[ext]',
        // Provide global variable names for external imports
        globals: {},
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Minimize for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
      },
    },
    // Output to dist folder
    outDir: 'dist',
    // Clean output directory before build
    emptyOutDir: true,
  },
  // Define environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    global: 'globalThis',
    __webpack_public_path__: '""',
  },
  // Resolve aliases
  resolve: {
    alias: [
      {
        find: /^~(.*)$/,
        replacement: '$1',
      },
      {
        find: '@',
        replacement: resolve(__dirname, 'src'),
      },
    ],
  },
});
