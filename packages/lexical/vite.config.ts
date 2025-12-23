/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Vite build for Jupyter Lexical
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

export default defineConfig(({ mode }) => {
  // Configurable base; defaults to "/" for dev, can be overridden via env
  const baseUrl = process.env.VITE_BASE_URL || '/';

  return {
    base: mode === 'production' ? './' : baseUrl || '/',
    plugins: [
      react(),
      // Generate TypeScript declaration files in production mode
      ...(mode === 'production'
        ? [
            dts({
              outDir: 'lib',
              include: ['src/**/*.ts', 'src/**/*.tsx'],
              exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/examples/**',
              ],
              copyDtsFiles: true,
              staticImport: true,
              insertTypesEntry: true,
            }),
          ]
        : []),
      // Plugin to handle ?raw CSS imports (.raw.css files)
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
      // Plugin to convert ?text queries to ?raw (for service workers, etc.)
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
      // Force CSS `?raw` requests to be served as JS modules exporting strings
      {
        name: 'css-raw-to-string',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('.css?raw')) {
            return {
              code: `export default ${JSON.stringify(code)};`,
              map: null,
            };
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: [
        { find: 'stream', replacement: 'stream-browserify' },
        // Handle ~ prefix in imports (webpack convention) - strip ~ and resolve normally
        { find: /^~(.*)$/, replacement: '$1' },
      ],
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
    server: {
      port: 3211,
      open: false,
      hmr: true,
    },
    build: {
      outDir: mode === 'production' ? 'lib' : 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      emptyOutDir: false,
      lib:
        mode === 'production'
          ? {
              entry: resolve(__dirname, 'src/index.ts'),
              formats: ['es'],
            }
          : undefined,
      rollupOptions:
        mode === 'production'
          ? {
              external: [
                'react',
                'react-dom',
                '@datalayer/jupyter-react',
                /@datalayer\/jupyter-react\/.*/,
                /@jupyterlab\/.*/,
                /@lumino\/.*/,
                /@jupyter\/.*/,
                /@lexical\/.*/,
                /^lexical$/,
              ],
              output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: assetInfo => {
                  const name = assetInfo.names?.[0] || assetInfo.name || '';
                  if (name.endsWith('.css')) {
                    return '[name][extname]';
                  }
                  return 'assets/[name][extname]';
                },
              },
            }
          : {
              input: {
                main: resolve(__dirname, 'src/examples/index.tsx'),
              },
              output: {
                entryFileNames: '[name].jupyter-lexical.js',
                chunkFileNames: '[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
              },
            },
    },
    assetsInclude: ['**/*.wasm', '**/*.raw.css'],
    define: {
      global: 'globalThis',
      __webpack_public_path__: '""',
      'process.env': {},
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
      // Exclude lexical packages from pre-bundling - they have broken exports maps
      // The alias in resolve.alias handles resolving them
      exclude: ['@lexical/react', '@lexical/rich-text'],
    },
  };
});
