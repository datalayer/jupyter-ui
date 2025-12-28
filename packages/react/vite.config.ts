/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';
import { readFileSync, existsSync } from 'fs';
import { transformSync } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import ENTRY from shared entries.js file so Vite and webpack stay in sync
const require = createRequire(import.meta.url);
const { ENTRY } = require('./entries.js');

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      treatAsCommonjs(),
      // Serve pyodide workers as classic scripts to support importScripts
      {
        name: 'pyodide-worker-serve-raw',
        enforce: 'pre',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            const isPyodideWorker =
              url.includes('comlink.worker.js') ||
              url.includes('coincident.worker.js') ||
              url.includes('worker.js?worker_file');

            if (!isPyodideWorker) {
              return next();
            }

            // Strip type=module to avoid module treatment
            const cleanUrl = url
              .replace('&type=module', '')
              .replace('?type=module&', '?')
              .replace('?type=module', '')
              .split('?')[0];

            const fileName = cleanUrl.split('/').pop();
            if (!fileName) {
              return next();
            }

            const candidatePaths = [
              resolve(
                __dirname,
                'node_modules',
                '@jupyterlite/pyodide-kernel/lib',
                fileName
              ),
              resolve(
                __dirname,
                '../../node_modules',
                '@jupyterlite/pyodide-kernel/lib',
                fileName
              ),
              resolve(
                __dirname,
                '../../../node_modules',
                '@jupyterlite/pyodide-kernel/lib',
                fileName
              ),
              resolve(
                __dirname,
                '../../../../node_modules',
                '@jupyterlite/pyodide-kernel/lib',
                fileName
              ),
              resolve(
                __dirname,
                '../../../../../node_modules',
                '@jupyterlite/pyodide-kernel/lib',
                fileName
              ),
              // Vite prebundled deps location
              resolve(__dirname, 'node_modules', '.vite', 'deps', fileName),
            ];

            for (const candidate of candidatePaths) {
              if (existsSync(candidate)) {
                const content = readFileSync(candidate, 'utf-8');
                // Force classic worker by transpiling to IIFE
                const { code } = transformSync(content, {
                  format: 'iife',
                  target: 'es2019',
                });
                res.setHeader('Content-Type', 'application/javascript');
                res.statusCode = 200;
                res.end(code);
                return;
              }
            }

            // Fall through to next handler if not found
            next();
          });
        },
      },
      // Serve wheel files as binary without transformation (prevents corruption)
      {
        name: 'wheel-serve-binary',
        enforce: 'pre',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const url = req.url || '';
            if (!url.includes('.whl')) {
              return next();
            }

            // Strip query and decode path
            const cleanUrl = decodeURIComponent(url.split('?')[0]);

            // Handle Vite /@fs/ absolute path prefix
            const absoluteFromFs = cleanUrl.startsWith('/@fs/')
              ? cleanUrl.replace('/@fs', '')
              : null;

            const fileName = cleanUrl.split('/').pop();
            const candidatePaths = [
              absoluteFromFs,
              fileName
                ? resolve(
                    __dirname,
                    'node_modules',
                    '@jupyterlite/pyodide-kernel/pypi',
                    fileName
                  )
                : null,
              fileName
                ? resolve(
                    __dirname,
                    '../../node_modules',
                    '@jupyterlite/pyodide-kernel/pypi',
                    fileName
                  )
                : null,
              fileName
                ? resolve(
                    __dirname,
                    '../../../node_modules',
                    '@jupyterlite/pyodide-kernel/pypi',
                    fileName
                  )
                : null,
              fileName
                ? resolve(
                    __dirname,
                    '../../../../node_modules',
                    '@jupyterlite/pyodide-kernel/pypi',
                    fileName
                  )
                : null,
              fileName
                ? resolve(
                    __dirname,
                    '../../../../../node_modules',
                    '@jupyterlite/pyodide-kernel/pypi',
                    fileName
                  )
                : null,
            ].filter(Boolean) as string[];

            for (const candidate of candidatePaths) {
              if (existsSync(candidate)) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/octet-stream');
                const stream = createReadStream(candidate);
                stream.pipe(res);
                stream.on('error', () => next());
                return;
              }
            }

            next();
          });
        },
      },
      // Plugin to intercept pyodide kernel worker requests and serve as classic workers
      {
        name: 'pyodide-worker-classic',
        enforce: 'pre',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            // Intercept worker file requests with type=module and redirect without it
            if (
              req.url &&
              req.url.includes('worker') &&
              req.url.includes('type=module')
            ) {
              // Remove type=module from the URL and re-request
              const newUrl = req.url
                .replace('&type=module', '')
                .replace('?type=module&', '?')
                .replace('?type=module', '');
              req.url = newUrl;
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
      // Plugin to handle pyodide kernel workers - ensure they're not treated as ES modules
      {
        name: 'pyodide-worker-handler',
        enforce: 'post',
        transform(code, id) {
          // Transform any code that creates workers with type: 'module'
          if (
            code.includes('new Worker') &&
            code.includes('type') &&
            (id.includes('@jupyterlite/pyodide-kernel') ||
              id.includes('comlink') ||
              id.includes('coincident'))
          ) {
            // Remove type: "module" or type: 'module' from new Worker calls
            let transformed = code.replace(
              /new Worker\(([^)]+),\s*\{\s*type:\s*["']module["']\s*\}/g,
              'new Worker($1)'
            );
            // Also handle cases where type: "module" is in the options object
            transformed = transformed.replace(
              /type:\s*["']module["']\s*,?\s*/g,
              ''
            );
            if (transformed !== code) {
              return { code: transformed, map: null };
            }
          }
          return null;
        },
      },
      // Plugin to handle worker file requests - strip type=module from URLs
      {
        name: 'worker-url-handler',
        enforce: 'pre',
        resolveId(source, importer) {
          // Remove type=module from worker URLs
          if (source.includes('?') && source.includes('type=module')) {
            const cleaned = source.replace(/[?&]type=module/, '');
            return this.resolve(cleaned, importer, { skipSelf: true });
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
      middlewareMode: false,
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
      rollupOptions: {
        output: {
          entryFileNames: '[name].js',
          format: 'iife',
        },
      },
    },
    // CSS handling
    css: {
      devSourcemap: true,
    },
  };
});
