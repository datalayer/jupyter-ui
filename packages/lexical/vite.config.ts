/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Vite build for Jupyter Lexical
 */

import { defineConfig, loadEnv, type Plugin } from 'vite';
import { build as esbuild } from 'esbuild';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

/**
 * The Loom recorder on a React 18 of its own.
 *
 * `@loomhq/record-sdk` peers on React 18, imports it from the host and
 * mounts through `ReactDOM.render`, which React 19 removed; these examples
 * run 19. Vite has no module layers, so the SDK is bundled apart: esbuild
 * builds it, with everything it imports, into one module in which every
 * `react` and `react-dom` is the pair installed in `vendor/react18`
 * (`npm run install:react18`), and Vite serves that module wherever the
 * source imports the SDK. `is-supported`, the SDK's other entry, is bundled
 * the same way: left to Vite it would reach CommonJS dependencies the dep
 * optimizer never saw. `webpack.config.js` does the same with a layer.
 *
 * Without the pair the plugin stands aside, and a Loom block says why it
 * cannot record. Not used for the library build: there the SDK stays an
 * import, and giving it React 18 is the host's business.
 */
function loomRecorderOnReact18(mode: string): Plugin {
  const react18 = resolve(__dirname, 'vendor', 'react18');
  const available = existsSync(
    resolve(react18, 'node_modules', 'react-dom', 'package.json'),
  );
  const ENTRIES = ['@loomhq/record-sdk', '@loomhq/record-sdk/is-supported'];
  const VIRTUAL = '\0loom-react18:';
  const bundled = new Map<string, Promise<string>>();
  const bundle = async (entry: string): Promise<string> => {
    const result = await esbuild({
      stdin: {
        contents: `export * from '${entry}';`,
        resolveDir: __dirname,
        loader: 'js',
      },
      bundle: true,
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      minify: mode === 'production',
      write: false,
      logLevel: 'error',
      // Never written: an output folder is what lets esbuild split out the
      // stylesheets Atlaskit's icons import.
      outdir: resolve(__dirname, 'node_modules', '.loom18'),
      loader: {
        '.svg': 'dataurl',
        '.png': 'dataurl',
        '.woff': 'dataurl',
        '.woff2': 'dataurl',
        '.ttf': 'dataurl',
      },
      define: {
        'process.env.NODE_ENV': JSON.stringify(
          mode === 'production' ? 'production' : 'development',
        ),
        global: 'globalThis',
      },
      plugins: [
        {
          name: 'react-18',
          setup(build) {
            // Resolved from vendor/react18 by esbuild itself, so that the
            // browser builds are picked (`react-dom/server.browser`), not
            // the Node ones a `require.resolve` would give.
            build.onResolve({ filter: /^react(-dom)?(\/.*)?$/ }, args =>
              args.pluginData?.react18
                ? undefined
                : build.resolve(args.path, {
                    kind: args.kind,
                    resolveDir: react18,
                    pluginData: { react18: true },
                  }),
            );
          },
        },
      ],
    });
    const js = result.outputFiles.find(file => file.path.endsWith('.js'));
    const css = result.outputFiles.find(file => file.path.endsWith('.css'));
    const style = css
      ? `if (typeof document !== 'undefined') { const style = document.createElement('style'); style.setAttribute('data-loom-record-sdk', ''); style.textContent = ${JSON.stringify(css.text)}; document.head.appendChild(style); }\n`
      : '';
    return style + (js?.text ?? '');
  };
  return {
    name: 'loom-recorder-on-react-18',
    enforce: 'pre',
    resolveId(source) {
      return available && ENTRIES.includes(source) ? VIRTUAL + source : null;
    },
    load(id) {
      if (!id.startsWith(VIRTUAL)) {
        return null;
      }
      const entry = id.slice(VIRTUAL.length);
      let module = bundled.get(entry);
      if (!module) {
        module = bundle(entry);
        bundled.set(entry, module);
      }
      return module;
    },
  };
}

export default defineConfig(({ mode }) => {
  // Configurable base; defaults to "/" for dev, can be overridden via env
  const baseUrl = process.env.VITE_BASE_URL || '/';
  // The shell's environment first, then `.env.local` (git-ignored; a bare
  // `.env` is not, so the Loom id does not go there).
  const env = loadEnv(mode, __dirname, '');

  return {
    base: mode === 'production' ? './' : baseUrl || '/',
    plugins: [
      react(),
      ...(mode === 'production' ? [] : [loomRecorderOnReact18(mode)]),
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
      // Loom's public app id, for recording in a Loom block. From the
      // environment only: this repository is public and keeps no key.
      'process.env.LOOM_PUBLIC_APP_ID': JSON.stringify(
        env.LOOM_PUBLIC_APP_ID || '',
      ),
    },
    optimizeDeps: {
      // Keep normal CSS handling so imported styles are injected in Vite dev.
      // Raw CSS strings are handled explicitly via `?raw` and related plugins above.
      esbuildOptions: {
        target: 'esnext',
        // The ipywidgets embed (jupyter-react's `libembed-amd`) puts an AMD
        // `define` on the page. A UMD module in the pre-bundle — es6-promise-pool,
        // which @jupyterlab/services' kernel pool constructs — then registers
        // with AMD instead of setting `module.exports`, and its ESM default is
        // an empty object: "import_es6_promise_pool.default is not a
        // constructor". Inside the pre-bundle there is no AMD.
        define: { 'define.amd': 'undefined' },
      },
      include: ['react', 'react-dom'],
      // Every @lexical/* package is pre-bundled, none excluded: an excluded
      // one is served from source and loads its own `@lexical/html` and
      // `lexical`, next to the copies inlined in the pre-bundled chunks —
      // and the extension builder refuses two `@lexical/html/CoreImport`
      // extensions with the same name.
      exclude: [
        // Bundled on React 18 by `loomRecorderOnReact18`, not pre-bundled on 19.
        '@loomhq/record-sdk',
        // Use source alias for jupyter-react so Vite transforms its dynamic imports.
        '@datalayer/jupyter-react',
        // Exclude theme CSS to allow ?raw imports to work
        '@jupyterlab/theme-light-extension',
        '@jupyterlab/theme-dark-extension',
      ],
    },
  };
});
