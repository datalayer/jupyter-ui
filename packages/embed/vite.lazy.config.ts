/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Vite configuration for lazy-loading build with proper code splitting
 *
 * This build uses dynamic imports (React.lazy) to enable true code splitting.
 * The main entry point is kept small (~100KB) and component chunks are loaded
 * on-demand when rendered.
 *
 * Output structure:
 *   dist-lazy/
 *     jupyter-embed.lazy.js        - Main entry (~100KB)
 *     chunks/
 *       jupyter-cell-[hash].js     - Cell component chunk
 *       jupyter-notebook-[hash].js - Notebook component chunk
 *       jupyter-output-[hash].js   - Output component chunk
 *       jupyter-terminal-[hash].js - Terminal component chunk (xterm)
 *       jupyter-console-[hash].js  - Console component chunk
 *       jupyter-viewer-[hash].js   - Viewer component chunk
 *       vendor-react-[hash].js     - React runtime
 *       vendor-jupyterlab-[hash].js - Shared JupyterLab code
 *
 * Usage:
 *   <script type="module" src="https://cdn/jupyter-embed.lazy.js"></script>
 */

import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from './vite-plugins/cssInjectedByJs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    cssInjectedByJsPlugin() as PluginOption,
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
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index-lazy.ts'),
      formats: ['es'],
      fileName: () => 'jupyter-embed.lazy.js',
    },
    rollupOptions: {
      output: {
        // Chunk file names with hash for caching
        chunkFileNames: chunkInfo => {
          // Give descriptive names to our component chunks
          const name = chunkInfo.name || 'chunk';
          return `chunks/${name}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Enable code splitting for dynamic imports
        // This is the key difference from the non-lazy build
        inlineDynamicImports: false,
        // Manual chunks for vendor splitting
        manualChunks: id => {
          // React core - shared by all
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // Primer/UI components - shared by all
          if (
            id.includes('node_modules/@primer/') ||
            id.includes('node_modules/@datalayer/primer-addons')
          ) {
            return 'vendor-primer';
          }

          // xterm.js - only needed for terminal
          if (
            id.includes('node_modules/xterm') ||
            id.includes('node_modules/@xterm/')
          ) {
            return 'vendor-xterm';
          }

          // CodeMirror - needed for cells and notebooks
          if (
            id.includes('node_modules/@codemirror/') ||
            id.includes('node_modules/@lezer/')
          ) {
            return 'vendor-codemirror';
          }

          // MathJax - for math rendering
          if (id.includes('node_modules/mathjax')) {
            return 'vendor-mathjax';
          }

          // Let Rollup handle JupyterLab modules naturally
          // They'll be included with the component that imports them
          // This avoids TDZ issues from splitting tightly coupled modules

          return undefined;
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    outDir: 'dist-lazy',
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    global: 'globalThis',
    __dirname: JSON.stringify('/'),
    __filename: JSON.stringify('/index.js'),
  },
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
