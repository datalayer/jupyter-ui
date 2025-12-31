/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Vite configuration for code-split ES modules build
 * 
 * This produces ES modules that browsers can load dynamically.
 * The bootstrap script loads only what's needed.
 */

import { defineConfig, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
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
      entry: {
        'jupyter-embed': resolve(__dirname, 'src/index.ts'),
        'bootstrap': resolve(__dirname, 'src/bootstrap.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        dir: 'dist-esm',
        // Use ES module format with code splitting
        format: 'es',
        // Entry file names
        entryFileNames: '[name].js',
        // Chunk file names  
        chunkFileNames: 'chunks/[name]-[hash].js',
        // Asset file names
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Manual chunk splitting for vendor dependencies
        manualChunks: (id) => {
          // Group large vendor packages
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Jupyter ecosystem (large!)
            if (id.includes('@jupyterlab')) {
              if (id.includes('codemirror') || id.includes('codeeditor')) {
                return 'vendor-codemirror';
              }
              if (id.includes('outputarea') || id.includes('rendermime')) {
                return 'vendor-renderers';
              }
              return 'vendor-jupyterlab';
            }
            // Lumino
            if (id.includes('@lumino')) {
              return 'vendor-lumino';
            }
            // CodeMirror
            if (id.includes('@codemirror') || id.includes('codemirror')) {
              return 'vendor-codemirror';
            }
            // xterm
            if (id.includes('@xterm') || id.includes('xterm')) {
              return 'vendor-xterm';
            }
            // MathJax
            if (id.includes('mathjax')) {
              return 'vendor-mathjax';
            }
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
    outDir: 'dist-esm',
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

