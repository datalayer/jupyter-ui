/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';
import dts from 'vite-plugin-dts';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import ENTRY from shared entries.js file so Vite and webpack stay in sync
const require = createRequire(import.meta.url);
const { ENTRY } = require('./entries.js');

export default defineConfig(({ mode }) => {
  // Base path for assets - configurable via VITE_BASE_URL env var
  // Default is empty (for dev server), set to '/static/jupyter_react/' when built with hatch
  const baseUrl = process.env.VITE_BASE_URL || '';

  return {
    // Use relative base in production library mode for proper asset resolution
    base: mode === 'production' ? './' : baseUrl || '/',
    plugins: [
      // NOTE: pypi-server plugin commented out - wheels are now served from CDN
      // Uncomment to serve /pypi/*.whl and /pypi/*.json files from local source
      // {
      //   name: 'pypi-server',
      //   enforce: 'pre',
      //   configureServer(server) {
      //     server.middlewares.use((req, res, next) => {
      //       const url = req.url || '';
      //       // Only handle /pypi/* requests
      //       if (!url.startsWith('/pypi/')) return next();
      //
      //       const cleanUrl = decodeURIComponent(url.split('?')[0]);
      //       const fileName = cleanUrl.replace('/pypi/', '');
      //
      //       // Serve from local pypi folder in source
      //       const localPath = resolve(
      //         __dirname,
      //         'src/jupyter/lite/pyodide-kernel/pypi',
      //         fileName
      //       );
      //
      //       if (existsSync(localPath)) {
      //         res.statusCode = 200;
      //         if (fileName.endsWith('.whl')) {
      //           res.setHeader('Content-Type', 'application/octet-stream');
      //         } else if (fileName.endsWith('.json')) {
      //           res.setHeader('Content-Type', 'application/json');
      //         }
      //         createReadStream(localPath).pipe(res);
      //         return;
      //       }
      //
      //       console.log('[pypi-server] Not found:', localPath);
      //       next();
      //     });
      //   },
      // },
      react(),
      treatAsCommonjs(),
      // Generate TypeScript declaration files in production mode
      ...(mode === 'production'
        ? [
            dts({
              outDir: 'lib',
              include: ['src/**/*.ts', 'src/**/*.tsx'],
              exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
              copyDtsFiles: true,
              staticImport: true,
              insertTypesEntry: true,
            }),
          ]
        : []),
      // Plugin to handle dynamic ?raw CSS imports from node_modules (JupyterLab themes)
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
            console.warn(`Could not load theme CSS: ${cssPath}`);
            console.warn(`Tried paths:`, possiblePaths);
            return 'export default "";';
          }
          return null;
        },
      },
      // Plugin to handle ?raw CSS imports (theme CSS as strings)
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
      // Plugin to shim @fortawesome (equivalent to webpack NormalModuleReplacementPlugin)
      {
        name: 'shim-fortawesome',
        enforce: 'pre',
        resolveId(source) {
          if (source.includes('@fortawesome')) {
            return '\0empty-shim';
          }
          return null;
        },
        load(id) {
          if (id === '\0empty-shim') {
            return 'export default {}; export {};';
          }
          return null;
        },
      },
      // Plugin to inject the ENTRY into index.html
      {
        name: 'inject-entry',
        transformIndexHtml(html) {
          const entryWithExt =
            ENTRY.match(/\.(t|j)sx?$/) !== null ? ENTRY : `${ENTRY}.tsx`;
          const resolvedEntry = entryWithExt.replace('./', '/');
          // Replace the placeholder entry point with the actual ENTRY
          return html.replace(/src="[^"]+\.tsx"/, `src="${resolvedEntry}"`);
        },
      },
    ],
    // Include these file types as assets
    assetsInclude: ['**/*.whl', '**/*.raw.css'],
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
      alias: [
        // Handle ~ prefix in imports (commonly used for node_modules)
        { find: /^~(.*)$/, replacement: '$1' },
        // Polyfill stream for browser
        { find: 'stream', replacement: 'stream-browserify' },
      ],
    },
    // Configure how CommonJS modules are handled
    ssr: {
      // Force these CommonJS packages to be bundled properly
      noExternal: ['mime'],
    },
    // Define global variables
    define: {
      global: 'globalThis',
      __webpack_public_path__: '""',
      'process.env': {},
    },
    server: {
      port: 3208,
      open: false,
      hmr: true,
      fs: {
        // Allow serving files from node_modules (needed for dynamic CSS imports)
        allow: ['..'],
      },
    },
    preview: {
      port: 3208,
    },
    build: {
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
                /@jupyterlab\/.*/,
                /@lumino\/.*/,
                /@jupyter\/.*/,
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
                  // Worker files in assets/
                  return 'assets/[name][extname]';
                },
              },
            }
          : {
              input: {
                main: './index.html',
              },
              output: {
                entryFileNames: '[name].jupyter-react.js',
                chunkFileNames: '[name]-[hash].js',
                assetFileNames: assetInfo => {
                  const name = assetInfo.name || '';
                  if (/pypi\//.test(name)) {
                    return 'pypi/[name][extname]';
                  }
                  if (/schema\//.test(name)) {
                    return 'schema/[name][extname]';
                  }
                  return 'assets/[name]-[hash][extname]';
                },
              },
            },
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@primer/react',
        'yjs',
        'y-websocket',
        // Force pre-bundle mime to handle CommonJS default export
        'mime',
        // Force pre-bundle mock-socket to handle exports properly
        'mock-socket',
        // Force pre-bundle styled-components and its CJS deps together
        'styled-components',
        // Force pre-bundle lumino packages to ensure single Token instances
        '@lumino/coreutils',
        '@lumino/application',
        '@lumino/signaling',
        // Force pre-bundle jupyterlab packages to ensure single instances
        '@jupyterlab/coreutils',
        '@jupyterlab/services',
        // Pre-bundle comlink and coincident for worker communication
        'comlink',
        'coincident',
        // Pre-bundle xterm packages for proper ESM interop
        '@xterm/xterm',
        '@xterm/addon-fit',
        '@xterm/addon-webgl',
        '@xterm/addon-canvas',
        '@xterm/addon-web-links',
        '@xterm/addon-search',
      ],
      esbuildOptions: {
        loader: {
          '.whl': 'text',
          '.css': 'text',
        },
        // Define for esbuild optimization phase
        define: {
          global: 'globalThis',
        },
      },
      // Exclude packages that have issues with pre-bundling
      exclude: [
        // Exclude theme CSS to allow ?raw imports to work
        '@jupyterlab/theme-light-extension',
        '@jupyterlab/theme-dark-extension',
      ],
    },
    // Worker configuration
    worker: {
      format: mode === 'production' ? 'es' : 'iife',
      plugins: () => [],
    },
    // CSS handling
    css: {
      devSourcemap: true,
    },
  };
});
