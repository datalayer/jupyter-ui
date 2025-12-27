/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';
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
  const env = loadEnv(mode, process.cwd(), '');

  //  const IS_LOCAL_JUPYTER_SERVER = env.LOCAL_JUPYTER_SERVER === 'true';
  //  const IS_NO_CONFIG = env.NO_CONFIG === 'true';

  // Determine which index.html to use based on environment
  // Note: Vite uses index.html at root, so we'll handle config via env vars instead

  return {
    plugins: [
      react(),
      treatAsCommonjs(),
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
        // Force pre-bundle jupyterlab packages to ensure single instances
        '@jupyterlab/coreutils',
        '@jupyterlab/services',
        '@jupyterlite/pyodide-kernel',
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
        // Exclude JupyterLite packages for better debugging (source maps)
        // '@jupyterlite/kernel',
        // '@jupyterlite/pyodide-kernel',
        // '@jupyterlite/session',
        // '@jupyterlite/contents',
      ],
    },

    // CSS handling
    css: {
      devSourcemap: true,
    },
  };
});
