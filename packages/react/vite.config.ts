/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { treatAsCommonjs } from 'vite-plugin-treat-umd-as-commonjs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Entry points for examples (dev mode)
const ENTRY_POINTS: Record<string, string> = {
  app: './src/app/App.tsx',
  cell: './src/examples/Cell.tsx',
  console: './src/examples/Console.tsx',
  filebrowser: './src/examples/FileBrowser.tsx',
  notebook: './src/examples/Notebook.tsx',
  notebookthemecolormode: './src/examples/NotebookThemeColormode.tsx',
  terminal: './src/examples/Terminal.tsx',
  viewer: './src/examples/Viewer.tsx',
};

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_LOCAL_JUPYTER_SERVER = process.env.LOCAL_JUPYTER_SERVER === 'true';
const IS_NO_CONFIG = process.env.NO_CONFIG === 'true';
const BUILD_LIB = process.env.BUILD_LIB === 'true';

export default defineConfig(({ mode, command }) => {
  const isServe = command === 'serve';
  const isBuild = command === 'build';

  // Library build configuration
  if (isBuild && BUILD_LIB) {
    return {
      build: {
        lib: {
          entry: path.resolve(__dirname, 'src/index.ts'),
          name: 'JupyterReact',
          formats: ['es', 'cjs'],
          fileName: format => {
            const FORMAT_EXTENSION_MAP: Record<string, string> = {
              es: 'js',
              cjs: 'cjs',
            };
            const ext = FORMAT_EXTENSION_MAP[format] || 'js';
            return `index.${ext}`;
          },
        },
        outDir: 'lib',
        sourcemap: true,
        emptyOutDir: false, // Don't clean TypeScript output
        rollupOptions: {
          external: [
            'react',
            'react-dom',
            'react/jsx-runtime',
            /^@jupyterlab\/.*/,
            /^@lumino\/.*/,
            /^@jupyter\/.*/,
            /^@jupyter-widgets\/.*/,
            /^@jupyterlite\/.*/,
          ],
          output: {
            preserveModules: true,
            preserveModulesRoot: 'src',
            assetFileNames: assetInfo => {
              if (assetInfo.name?.endsWith('.css')) {
                return '[name][extname]';
              }
              return 'assets/[name]-[hash][extname]';
            },
          },
        },
      },
      plugins: [react(), treatAsCommonjs()],
    };
  }

  // Development server and example build configuration
  return {
    root: __dirname,
    server: {
      port: 3208,
      host: true,
      hmr: {
        overlay: false,
      },
      proxy: IS_LOCAL_JUPYTER_SERVER
        ? {
            '/api': {
              target: 'http://localhost:8686',
              ws: true,
              changeOrigin: true,
            },
            '/terminals': {
              target: 'http://localhost:8686',
              ws: true,
              changeOrigin: true,
            },
          }
        : undefined,
    },
    plugins: [
      react(),
      treatAsCommonjs(),
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
            if (resolved) {
              return resolved.id;
            }
            return fixed;
          }
          return null;
        },
      },
      {
        name: 'handle-theme-css',
        enforce: 'pre',
        transform(code, id) {
          if (id.includes('style/theme.css')) {
            return {
              code: `export default ${JSON.stringify(code)};`,
              map: null,
            };
          }
        },
      },
    ],
    assetsInclude: ['**/*.whl', '**/*.raw.css', '**/*.ipynb', '**/*.json'],
    resolve: {
      alias: [
        {
          find: /^~(.*)$/,
          replacement: '$1',
        },
        {
          find: 'stream',
          replacement: 'stream-browserify',
        },
      ],
    },
    define: {
      global: 'globalThis',
      'process.env': process.env,
      // Required for JupyterLab and ipywidgets compatibility
      __webpack_public_path__: '""',
    },
    worker: {
      format: 'es',
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@primer/react', 'styled-components'],
      exclude: [
        '@jupyterlab/application',
        '@jupyterlab/apputils',
        '@jupyterlite/server',
        '@jupyterlite/pyodide-kernel',
      ],
      esbuildOptions: {
        loader: {
          '.whl': 'text',
        },
      },
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: isServe
          ? undefined
          : {
              main: path.resolve(__dirname, 'index.html'),
              ...Object.fromEntries(
                Object.entries(ENTRY_POINTS).map(([name, entry]) => [
                  name,
                  path.resolve(__dirname, entry),
                ])
              ),
            },
        output: {
          assetFileNames: assetInfo => {
            if (assetInfo.name && /pypi\//.test(assetInfo.name)) {
              return 'pypi/[name][extname]';
            }
            if (assetInfo.name && /schema\//.test(assetInfo.name)) {
              return 'schema/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
          entryFileNames: '[name].js',
        },
      },
    },
  };
});
