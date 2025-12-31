/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Vite configuration for ES modules build with vendor chunking
 * 
 * This is Phase 1 of the code-splitting strategy:
 * - Uses existing codebase with no changes
 * - Outputs ES modules that browsers can cache independently
 * - Automatically splits vendor dependencies into cacheable chunks
 * 
 * Usage:
 *   <script type="module" src="https://cdn/jupyter-embed.esm.js"></script>
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
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'jupyter-embed.esm.js',
    },
    rollupOptions: {
      output: {
        // Chunk file names with hash for caching
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // Handle circular dependencies in CommonJS modules
        hoistTransitiveImports: false,
        // Split vendor dependencies for better caching
        // Keep JupyterLab packages together to avoid circular dependency TDZ errors
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React and related packages (~150KB)
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // Lumino (~200KB)
            if (id.includes('@lumino')) {
              return 'vendor-lumino';
            }
            // CodeMirror (~800KB)
            if (id.includes('@codemirror') || id.includes('codemirror')) {
              return 'vendor-codemirror';
            }
            // xterm (~400KB)
            if (id.includes('@xterm') || id.includes('xterm')) {
              return 'vendor-xterm';
            }
            // MathJax (~500KB)
            if (id.includes('mathjax')) {
              return 'vendor-mathjax';
            }
            // Keep ALL JupyterLab packages in one chunk to avoid TDZ errors
            // from circular dependencies between services, cells, notebook, etc.
            if (id.includes('@jupyterlab')) {
              return 'vendor-jupyterlab';
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
