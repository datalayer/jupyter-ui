/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
      // Plugin to handle dynamic ?raw CSS imports from node_modules (JupyterLab themes)
      // This uses resolveId + load to physically read the CSS file from disk
      // for dynamic imports like: import('@jupyterlab/theme-dark-extension/style/variables.css?raw')
      {
        name: 'jupyterlab-theme-css-raw',
        enforce: 'pre',
        resolveId(source) {
          // Handle dynamic imports like '@jupyterlab/theme-light-extension/style/variables.css?raw'
          if (
            source.includes('@jupyterlab/theme-') &&
            source.endsWith('.css?raw')
          ) {
            // Use \0 prefix to mark as virtual module
            return '\0' + source;
          }
          return null;
        },
        load(id) {
          if (
            id.startsWith('\0') &&
            id.includes('@jupyterlab/theme-') &&
            id.endsWith('.css?raw')
          ) {
            // Remove the \0 prefix and ?raw suffix to get the package path
            const cssPath = id.slice(1).replace('?raw', '');

            // List of possible node_modules locations (monorepo setup)
            // Use __dirname which is the directory of vite.config.ts
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
            console.warn(
              `[jupyterlab-theme-css-raw] Tried paths:`,
              possiblePaths,
            );
            return 'export default "";';
          }
          return null;
        },
      },
    ],
    resolve: {
      alias: [
        // In monorepo dev, force the stylesheet import to the source CSS used
        // by jupyter-react examples so Notebook styles are injected reliably.
        {
          find: '@datalayer/jupyter-react/style/index.css',
          replacement: resolve(__dirname, '../react/style/index.css'),
        },
        // Map tools subpath exports to source while running lexical with Vite.
        {
          find: /^@datalayer\/jupyter-react\/tools$/,
          replacement: resolve(__dirname, '../react/src/tools/index.ts'),
        },
        {
          find: /^@datalayer\/jupyter-react\/tools\/(.*)$/,
          replacement: resolve(__dirname, '../react/src/tools/$1'),
        },
        {
          find: /^@datalayer\/jupyter-react\/lib\/(.*)$/,
          replacement: resolve(__dirname, '../react/src/$1'),
        },
        {
          find: '@datalayer/jupyter-react',
          replacement: resolve(__dirname, '../react/src/index.ts'),
        },
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
      // Keep normal CSS handling so imported styles are injected in Vite dev.
      // Raw CSS strings are handled explicitly via `?raw` and related plugins above.
      esbuildOptions: {
        target: 'esnext',
      },
      include: ['react', 'react-dom'],
      // Exclude lexical packages from pre-bundling - they have broken exports maps
      // The alias in resolve.alias handles resolving them
      exclude: [
        // Use source alias for jupyter-react so Vite transforms its dynamic imports.
        '@datalayer/jupyter-react',
        '@lexical/react',
        '@lexical/rich-text',
        // Exclude theme CSS to allow ?raw imports to work
        '@jupyterlab/theme-light-extension',
        '@jupyterlab/theme-dark-extension',
      ],
    },
  };
});
