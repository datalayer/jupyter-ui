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
import { readFileSync } from 'fs';

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
          // Only match explicit ?raw query — not absolute paths that happen to contain 'raw'
          if (/\.css\?raw$/.test(id)) {
            return {
              code: `export default ${JSON.stringify(code)};`,
              map: null,
            };
          }
          return null;
        },
      },
      // Plugin to handle dynamic ?raw CSS imports from node_modules (JupyterLab themes)
      // This uses resolveId + load to physically read the CSS file from disk
      // for dynamic imports like: import('@jupyterlab/theme-dark-extension/style/variables.css?raw')
      {
        name: 'jupyterlab-theme-css-raw',
        enforce: 'pre',
        resolveId(source) {
          // Handle bare specifier imports with ?raw
          if (
            source.includes('@jupyterlab/theme-') &&
            source.endsWith('.css?raw')
          ) {
            return '\0' + source;
          }
          // Also handle without ?raw — Vite may strip it for CSS files
          if (
            source.includes('@jupyterlab/theme-') &&
            source.includes('variables.css') &&
            !source.endsWith('.css?raw')
          ) {
            return '\0' + source + '?raw';
          }
          return null;
        },
        load(id) {
          if (
            id.startsWith('\0') &&
            id.includes('@jupyterlab/theme-') &&
            (id.endsWith('.css?raw') || id.includes('variables.css'))
          ) {
            const cssPath = id.slice(1).replace('?raw', '');
            const possiblePaths = [
              resolve(__dirname, 'node_modules', cssPath),
              resolve(__dirname, '../../node_modules', cssPath),
              resolve(__dirname, '../../../node_modules', cssPath),
              resolve(__dirname, '../../../../node_modules', cssPath),
              resolve(__dirname, '../../../../../node_modules', cssPath),
              resolve(__dirname, '../../../../../../node_modules', cssPath),
            ];
            for (const resolvedPath of possiblePaths) {
              try {
                const cssContent = readFileSync(resolvedPath, 'utf-8');
                return `export default ${JSON.stringify(cssContent)};`;
              } catch {
                // Try next path
              }
            }
            console.warn(
              `[jupyterlab-theme-css-raw] Could not load theme CSS: ${cssPath}`,
            );
            return 'export default "";';
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
      fs: {
        // Allow serving files from the entire monorepo root
        // node_modules are at ../../../../../../node_modules (src/node_modules)
        allow: [resolve(__dirname, '../../../../../../')],
      },
    },
    build: {
      target: 'esnext',
      outDir: mode === 'production' ? 'lib' : 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      emptyOutDir: mode === 'production',
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
                  const name = assetInfo.name || '';
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
      esbuildOptions: {
        target: 'esnext',
        loader: {
          '.css': 'text',
        },
      },
      include: ['react', 'react-dom'],
      // Exclude lexical packages from pre-bundling - they have broken exports maps
      // The alias in resolve.alias handles resolving them
      exclude: [
        '@lexical/react',
        '@lexical/rich-text',
        // Exclude theme CSS to allow ?raw imports to work
        '@jupyterlab/theme-light-extension',
        '@jupyterlab/theme-dark-extension',
      ],
    },
  };
});
