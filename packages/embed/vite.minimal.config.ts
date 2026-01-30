/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Vite configuration for minimal bootstrap build
 *
 * This build creates the smallest possible initial payload.
 * Components are loaded on-demand via dynamic imports.
 *
 * Output structure:
 *   dist-minimal/
 *     jupyter-embed.min.js         - Bootstrap (~30KB)
 *     chunks/                       - Loaded on-demand
 *
 * Usage:
 *   <script type="module" src="https://cdn/jupyter-embed.min.js"></script>
 *   <script>
 *     JupyterEmbed.configureJupyterEmbed({ serverUrl: '...' });
 *     JupyterEmbed.initJupyterEmbeds();
 *   </script>
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
      entry: resolve(__dirname, 'src/index-minimal.ts'),
      formats: ['es'],
      fileName: () => 'jupyter-embed.min.js',
    },
    rollupOptions: {
      output: {
        // Chunk file names with hash for caching
        chunkFileNames: chunkInfo => {
          const name = chunkInfo.name || 'chunk';
          return `chunks/${name}-[hash].js`;
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Enable code splitting for dynamic imports
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

          // Primer/UI components
          if (
            id.includes('node_modules/@primer/') ||
            id.includes('node_modules/@datalayer/primer-addons')
          ) {
            return 'vendor-primer';
          }

          // xterm.js - only for terminal
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
    outDir: 'dist-minimal',
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
