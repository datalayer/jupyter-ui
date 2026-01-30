/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Vite configuration for bootstrap-only build (ultra-minimal)
 *
 * This creates the smallest possible initial payload - just the parser
 * and initialization logic. React and all components are loaded on-demand.
 *
 * Expected output:
 *   dist-bootstrap/
 *     jupyter-embed.js              - Bootstrap (~10-30KB)
 *     chunks/                        - Everything else, loaded on-demand
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
      entry: resolve(__dirname, 'src/index-bootstrap.ts'),
      formats: ['es'],
      fileName: () => 'jupyter-embed.js',
    },
    rollupOptions: {
      output: {
        chunkFileNames: chunkInfo => {
          const name = chunkInfo.name || 'chunk';
          return `chunks/${name}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Enable code splitting - this is the key!
        inlineDynamicImports: false,
        // Manual chunks for vendor splitting
        manualChunks: id => {
          // React core
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }

          // Primer UI
          if (
            id.includes('node_modules/@primer/') ||
            id.includes('node_modules/@datalayer/primer-addons')
          ) {
            return 'vendor-primer';
          }

          // xterm
          if (
            id.includes('node_modules/xterm') ||
            id.includes('node_modules/@xterm/')
          ) {
            return 'vendor-xterm';
          }

          // CodeMirror
          if (
            id.includes('node_modules/@codemirror/') ||
            id.includes('node_modules/@lezer/')
          ) {
            return 'vendor-codemirror';
          }

          // MathJax
          if (id.includes('node_modules/mathjax')) {
            return 'vendor-mathjax';
          }

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
    outDir: 'dist-bootstrap',
    emptyOutDir: true,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
    global: 'globalThis',
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
