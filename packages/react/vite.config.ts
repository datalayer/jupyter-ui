/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';
import { readFileSync, existsSync, createReadStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { transformSync } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import ENTRY from shared entries.js file so Vite and webpack stay in sync
const require = createRequire(import.meta.url);
const { ENTRY } = require('./entries.js');

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      // Inject a runtime shim to force classic workers for pyodide worker URLs
      {
        name: 'pyodide-worker-constructor-shim',
        enforce: 'pre',
        transformIndexHtml(html) {
          const shim = `\n<script>\n(() => {\n  const OriginalWorker = window.Worker;\n  if (!OriginalWorker) return;\n  window.Worker = function(url, options) {\n    const urlString = typeof url === 'string' ? url : String(url);\n    if (urlString.includes('comlink.worker') || urlString.includes('coincident.worker')) {\n      // Force classic worker by dropping the type option\n      return new OriginalWorker(urlString);\n    }\n    return new OriginalWorker(url, options);\n  };\n  window.Worker.prototype = OriginalWorker.prototype;\n  Object.defineProperty(window.Worker, 'name', { value: 'Worker' });\n})();\n</script>\n`;
          return html.replace('</head>', `${shim}</head>`);
        },
      },
      react(),
      treatAsCommonjs(),
      // Transform worker creation to use classic workers instead of module workers for pyodide
      {
        name: 'pyodide-worker-classic-transform',
        enforce: 'post',
        transform(code, id) {
          // Only transform JS/TS files that might create workers
          if (!id.match(/\.(js|ts|mjs|mts)$/)) return null;

          // Look for Worker constructor calls with type: 'module' and worker URLs
          // Match patterns like: new Worker(new URL("...worker.js...", import.meta.url), { type: "module" })
          if (
            code.includes('type') &&
            code.includes('module') &&
            code.includes('Worker')
          ) {
            // Replace { type: "module" } or { type: 'module' } with {} for worker constructors
            // This regex matches Worker constructor with type: module option
            const transformed = code.replace(
              /new\s+Worker\s*\(\s*([^,]+),\s*\{\s*type\s*:\s*["']module["']\s*\}\s*\)/g,
              'new Worker($1)'
            );
            if (transformed !== code) {
              console.log(
                '[pyodide-worker-classic-transform] Transformed worker creation in:',
                id
              );
              return { code: transformed, map: null };
            }
          }
          return null;
        },
      },
      // Serve pyodide worker files as classic scripts (IIFE) to support importScripts()
      {
        name: 'pyodide-worker-classic',
        enforce: 'pre',
        configureServer(server) {
          // Add middleware at the very beginning of the stack
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';

            // Match any worker file request that Vite is trying to serve as module
            const isWorkerModuleRequest =
              url.includes('worker') && url.includes('type=module');

            if (!isWorkerModuleRequest) {
              return next();
            }

            console.log(
              '[pyodide-worker-classic] Intercepting worker request:',
              url
            );

            // Clean URL: decode and strip query params
            const cleanUrl = decodeURIComponent(url.split('?')[0]);

            // Handle Vite /@fs/ absolute path prefix
            const absolutePath = cleanUrl.startsWith('/@fs/')
              ? cleanUrl.slice(4) // Remove /@fs prefix
              : null;

            // Try absolute path first
            if (absolutePath && existsSync(absolutePath)) {
              console.log(
                '[pyodide-worker-classic] Serving from absolute path:',
                absolutePath
              );
              try {
                const content = readFileSync(absolutePath, 'utf-8');
                // Transpile to IIFE to remove ES module syntax and support importScripts()
                const { code } = transformSync(content, {
                  format: 'iife',
                  target: 'es2020',
                  minify: false,
                });
                res.setHeader('Content-Type', 'application/javascript');
                res.statusCode = 200;
                res.end(code);
                return;
              } catch (e) {
                console.error(
                  '[pyodide-worker-classic] Error transforming worker:',
                  e
                );
              }
            }

            // Fallback: try to find file by name in node_modules
            const fileName = cleanUrl.split('/').pop();
            if (fileName) {
              const candidatePaths = [
                resolve(
                  __dirname,
                  '../../../../../node_modules/@jupyterlite/pyodide-kernel/lib',
                  fileName
                ),
                resolve(
                  __dirname,
                  '../../../../node_modules/@jupyterlite/pyodide-kernel/lib',
                  fileName
                ),
                resolve(
                  __dirname,
                  '../../../node_modules/@jupyterlite/pyodide-kernel/lib',
                  fileName
                ),
                resolve(
                  __dirname,
                  '../../node_modules/@jupyterlite/pyodide-kernel/lib',
                  fileName
                ),
                resolve(
                  __dirname,
                  'node_modules/@jupyterlite/pyodide-kernel/lib',
                  fileName
                ),
                // Also check .vite/deps for prebundled workers
                resolve(__dirname, 'node_modules/.vite/deps', fileName),
              ];

              for (const candidate of candidatePaths) {
                if (existsSync(candidate)) {
                  console.log(
                    '[pyodide-worker-classic] Serving from candidate path:',
                    candidate
                  );
                  try {
                    const content = readFileSync(candidate, 'utf-8');
                    const { code } = transformSync(content, {
                      format: 'iife',
                      target: 'es2020',
                      minify: false,
                    });
                    res.setHeader('Content-Type', 'application/javascript');
                    res.statusCode = 200;
                    res.end(code);
                    return;
                  } catch (e) {
                    console.error(
                      '[pyodide-worker-classic] Error transforming worker:',
                      e
                    );
                  }
                }
              }
            }

            next();
          });
        },
      },
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
            ];

            for (const resolvedPath of possiblePaths) {
              try {
                const cssContent = readFileSync(resolvedPath, 'utf-8');
                return `export default ${JSON.stringify(cssContent)};`;
              } catch (e) {
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
      outDir: 'dist',
      sourcemap: mode !== 'production',
      minify: mode === 'production',
      rollupOptions: {
        input: {
          main: './index.html',
        },
        output: {
          entryFileNames: '[name].jupyter-react.js',
          chunkFileNames: '[name]-[hash].js',
          // Handle special asset file names
          assetFileNames: assetInfo => {
            const name = assetInfo.name || '';
            // Place pypi files in the pypi folder
            if (/pypi\//.test(name)) {
              return 'pypi/[name][extname]';
            }
            // Place schema files in the schema folder
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
        // Force pre-bundle lumino packages to ensure single Token instances
        '@lumino/coreutils',
        '@lumino/application',
        '@lumino/signaling',
        // Force pre-bundle jupyterlab packages to ensure single instances
        '@jupyterlab/coreutils',
        '@jupyterlab/services',
        // '@jupyterlite/pyodide-kernel',
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
        // Exclude packages for better debugging (source maps)
        // '...',
        // Exclude packages with worker files to prevent dep optimization issues
        '@jupyterlite/pyodide-kernel',
        'comlink',
      ],
    },
    // Worker configuration
    worker: {
      format: 'iife',
      plugins: () => [],
    },
    // CSS handling
    css: {
      devSourcemap: true,
    },
  };
});
