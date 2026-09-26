/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from './vite-plugins/cssInjectedByJs';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inject CSS into JS bundle for single-file distribution
    cssInjectedByJsPlugin() as PluginOption,
    {
      // jupyter-react's marimo runtime is a lazily loaded 20 MB bundle of
      // marimo's frontend; a single-file distribution would inline it (and
      // ran out of heap doing so). The embed does not offer marimo, so the
      // bundle resolves to a stub that says so.
      name: 'no-marimo-runtime',
      enforce: 'pre',
      async resolveId(source, importer) {
        if (!importer) {
          return null;
        }
        const resolved = await this.resolve(source, importer, {
          skipSelf: true,
        });
        if (
          resolved &&
          /[\\/]lib[\\/]marimo[\\/]bundle[\\/]/.test(resolved.id)
        ) {
          return resolved.id.endsWith('.css')
            ? '\0marimo-stub.css'
            : '\0marimo-stub';
        }
        return null;
      },
      load(id) {
        if (id === '\0marimo-stub.css') {
          return '';
        }
        if (id === '\0marimo-stub') {
          return [
            'export const mount = () => new Error("marimo is not part of @datalayer/jupyter-embed");',
            'export const connectKernel = () => {};',
            'export const COMM_TARGET = "datalayer.marimo";',
            'export const HOST_NAME = "__datalayer_marimo_host__";',
            'export const kernelHostSource = () => "";',
            'export const store = undefined;',
            'export const notebookAtom = undefined;',
            'export const initializePlugins = () => {};',
          ].join('\n');
        }
        return null;
      },
    } as PluginOption,
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
        // Prevent circular dependency issues
        inlineDynamicImports: true,
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
  // Optimize dependencies
  optimizeDeps: {
    include: ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
  },
});
