/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Builds the marimo runtime bundle from `@marimo-team/frontend`'s sources.
 *
 * The package publishes marimo's app as raw TypeScript (its only export is
 * `./unstable_internal/*` → `./src/*`), written for marimo's own Vite build:
 * `@/` for its `src/`, `?inline` assets, Tailwind in its CSS. This script is
 * the build those sources need, with two substitutions: `core/wasm/bridge.ts`
 * becomes `src/kernelBridge.ts` (a Jupyter kernel instead of a Pyodide
 * worker), and `core/wasm/PyodideLoader`'s spinner stays as is.
 *
 * Output, in `src/marimo/bundle/` (for the dev servers) and, when `--lib` is
 * passed, `lib/marimo/bundle/` (for the package): `index.js` + chunks, and
 * marimo's compiled stylesheet as `marimo.css` with the fonts it references —
 * the stylesheet is taken from the package's own build rather than compiled,
 * because its Tailwind config is not published.
 *
 *   node marimo/build.mjs            # development build (also into lib/ when it exists)
 *   node marimo/build.mjs --lib      # minified, into src/marimo/bundle and lib/marimo/bundle
 */

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = path.resolve(here, '..');
const lib = process.argv.includes('--lib');

/** The installed `@marimo-team/frontend`, wherever npm hoisted it. */
function findMarimo() {
  if (process.env.MARIMO_FRONTEND_DIR) {
    return path.resolve(process.env.MARIMO_FRONTEND_DIR);
  }
  let dir = pkg;
  for (;;) {
    const candidate = path.join(
      dir,
      'node_modules',
      '@marimo-team',
      'frontend'
    );
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(
        '@marimo-team/frontend is not installed: run npm i (its workspace:* deps need the overrides in the root package.json)'
      );
    }
    dir = parent;
  }
}

const marimo = findMarimo();
const marimoSrc = path.join(marimo, 'src');
const version = JSON.parse(
  fs.readFileSync(path.join(marimo, 'package.json'), 'utf8')
).version;
const bridge = path.join(here, 'src', 'kernelBridge.ts');
// marimo's three workspace packages, vendored: npm cannot install them (see
// ../marimo-packages/README.md), so the build resolves them itself.
const vendored = path.join(pkg, 'marimo-packages');
const VENDORED = {
  '@marimo-team/marimo-api': path.join(
    vendored,
    'marimo-api',
    'src',
    'index.ts'
  ),
  '@marimo-team/smart-cells': path.join(
    vendored,
    'smart-cells',
    'src',
    'index.ts'
  ),
  '@marimo-team/llm-info': path.join(vendored, 'llm-info', 'src', 'index.ts'),
  '@marimo-team/llm-info/models.json': path.join(
    vendored,
    'llm-info',
    'data',
    'generated',
    'models.json'
  ),
  '@marimo-team/llm-info/providers.json': path.join(
    vendored,
    'llm-info',
    'data',
    'generated',
    'providers.json'
  ),
};

/** `@/x` → marimo's `src/x`; marimo's Pyodide bridge → the kernel bridge. */
const marimoResolver = {
  name: 'marimo-resolver',
  setup(build) {
    build.onResolve({ filter: /^@\// }, async args => {
      if (args.pluginData?.marimoResolved) {
        return null;
      }
      const target = path.join(marimoSrc, args.path.slice(2));
      const resolved = await build.resolve(target, {
        kind: args.kind,
        resolveDir: path.dirname(target),
        pluginData: { marimoResolved: true },
      });
      return resolved.errors.length
        ? { errors: resolved.errors }
        : { path: resolved.path };
    });
    build.onResolve(
      { filter: /^@marimo-team\/(marimo-api|smart-cells|llm-info)(\/|$)/ },
      args => {
        const bare = args.path.replace(/\?inline$/, '');
        if (VENDORED[bare]) {
          return {
            path: VENDORED[bare],
            namespace: args.path.endsWith('?inline') ? 'inline' : 'file',
          };
        }
        const icon = bare.match(/^@marimo-team\/llm-info\/icons\/(.+)$/);
        if (icon) {
          return {
            path: path.join(vendored, 'llm-info', 'icons', icon[1]),
            namespace: args.path.endsWith('?inline') ? 'inline' : 'file',
          };
        }
        return null;
      }
    );
    // marimo's Pyodide bridge, however it is imported, is the kernel bridge.
    build.onLoad(
      { filter: /[\\/]core[\\/]wasm[\\/]bridge\.ts$/ },
      async () => ({
        contents: await fs.promises.readFile(bridge, 'utf8'),
        loader: 'ts',
        resolveDir: path.dirname(bridge),
      })
    );
    // `x.svg?inline` / `x.css?inline`: the file's contents as a string.
    build.onResolve({ filter: /\?inline$/ }, async args => {
      const bare = args.path.replace(/\?inline$/, '');
      const resolved = await build.resolve(bare, {
        kind: args.kind,
        resolveDir: args.resolveDir,
      });
      return resolved.errors.length
        ? { errors: resolved.errors }
        : { path: resolved.path, namespace: 'inline' };
    });
    build.onLoad({ filter: /.*/, namespace: 'inline' }, async args => ({
      contents: await fs.promises.readFile(args.path),
      loader: args.path.endsWith('.css') ? 'text' : 'dataurl',
    }));
  },
};

/**
 * CommonJS modules in marimo's tree `require("react")`; esbuild turns that
 * into a runtime `require` lookup that browsers and bundlers do not have.
 * Every output file gets the host page's React under that name instead.
 */
const BANNER = [
  'import * as __ext_react from "react";',
  'import * as __ext_react_dom from "react-dom";',
  'const __marimoRequire = name => {',
  '  const m = name === "react" ? __ext_react : name === "react-dom" ? __ext_react_dom : undefined;',
  '  if (!m) throw new Error(`Dynamic require of "${name}" is not supported`);',
  '  return m.default && typeof m.default === "object" ? m.default : m;',
  '};',
].join('\n');

async function bundle(outdir) {
  fs.rmSync(outdir, { recursive: true, force: true });
  fs.mkdirSync(outdir, { recursive: true });
  const result = await esbuild.build({
    entryPoints: { index: path.join(here, 'src', 'entry.ts') },
    outdir,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    splitting: true,
    chunkNames: 'chunks/[name]-[hash]',
    assetNames: 'assets/[name]-[hash]',
    minify: lib,
    sourcemap: lib ? false : 'linked',
    jsx: 'automatic',
    metafile: true,
    logLevel: 'warning',
    plugins: [marimoResolver],
    banner: { js: BANNER },
    // marimo's own tsconfig, which its sources are written against: legacy
    // decorators, define semantics for class fields.
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: true,
        jsx: 'react-jsx',
        verbatimModuleSyntax: true,
        target: 'ES2020',
      },
    },
    // React is the host page's; pyodide is what the kernel bridge replaces;
    // tailwind only ever appears in CSS, which ships compiled.
    external: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-dom/client',
      'pyodide',
      'tailwindcss',
    ],
    loader: {
      '.css': 'empty',
      '.svg': 'dataurl',
      '.png': 'dataurl',
      '.ico': 'dataurl',
      '.gif': 'dataurl',
      '.jpg': 'dataurl',
      '.woff': 'dataurl',
      '.woff2': 'dataurl',
      '.ttf': 'dataurl',
      '.json': 'json',
      '.wasm': 'file',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        lib ? 'production' : 'development'
      ),
      'process.env.DEBUG': '""',
      'process.env.LOG': '""',
      'process.env.VSCODE_TEXTMATE_DEBUG': 'false',
      'process.env.NODE_DEBUG': 'false',
      'import.meta.env.MODE': JSON.stringify(
        lib ? 'production' : 'development'
      ),
      'import.meta.env.DEV': String(!lib),
      'import.meta.env.PROD': String(lib),
      'import.meta.env.VITE_MARIMO_VERSION': JSON.stringify(version),
      'import.meta.env.VITE_MARIMO_ISLANDS': '"false"',
    },
  });
  const outputs = Object.keys(result.metafile.outputs);
  const bytes = outputs.reduce(
    (sum, file) => sum + result.metafile.outputs[file].bytes,
    0
  );
  console.log(
    `marimo ${version}: ${outputs.length} files, ${(bytes / 1e6).toFixed(1)} MB → ${path.relative(pkg, outdir)}`
  );
}

/**
 * Two esbuild idioms webpack refuses when it bundles the output as a module:
 * a dynamic `import(url)` marimo marks `@vite-ignore` (webpack wants
 * `webpackIgnore`), and esbuild's `require` shim, which webpack tries to
 * resolve statically. Rewritten in place so every bundler serves the chunks.
 */
function bundlerFriendly(outdir) {
  const files = [
    path.join(outdir, 'index.js'),
    ...fs
      .readdirSync(path.join(outdir, 'chunks'))
      .filter(f => f.endsWith('.js'))
      .map(f => path.join(outdir, 'chunks', f)),
  ];
  let touched = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const next = text
      .replace(
        /\/\* @vite-ignore \*\//g,
        '/* webpackIgnore: true */ /* @vite-ignore */'
      )
      .replace(
        /typeof require !== "undefined" \? require :/g,
        'typeof __marimoRequire !== "undefined" ? __marimoRequire :'
      )
      .replace(
        /typeof require !== "undefined"\) return require\.apply\(/g,
        'typeof __marimoRequire !== "undefined") return __marimoRequire.apply('
      );
    if (next !== text) {
      fs.writeFileSync(file, next);
      touched += 1;
    }
  }
  if (touched) {
    console.log(`bundler-friendly rewrites in ${touched} files`);
  }
}

/**
 * `.wasm` files the chunks load with `new URL('./x.wasm', import.meta.url)`:
 * esbuild leaves those as they are, so the file has to sit beside the chunk.
 */
const WASM = {
  'loro_wasm_bg.wasm': 'loro-crdt/browser/loro_wasm_bg.wasm',
};

function wasmBesideChunks(outdir) {
  const chunks = path.join(outdir, 'chunks');
  const needed = new Set();
  for (const file of fs.readdirSync(chunks)) {
    if (!file.endsWith('.js')) {
      continue;
    }
    const text = fs.readFileSync(path.join(chunks, file), 'utf8');
    for (const match of text.matchAll(
      /new URL\((?:\\?["'])\.\/([\w.-]+\.wasm)(?:\\?["']), import\.meta\.url\)/g
    )) {
      needed.add(match[1]);
    }
  }
  for (const file of needed) {
    const source = WASM[file];
    if (!source) {
      throw new Error(
        `${file} is loaded by a chunk; add it to WASM in marimo/build.mjs`
      );
    }
    fs.copyFileSync(findModule(source), path.join(chunks, file));
  }
  if (needed.size) {
    console.log(`wasm beside chunks: ${[...needed].join(', ')}`);
  }
}

/** A file of an installed package, wherever npm hoisted the package. */
function findModule(relative) {
  let dir = pkg;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', relative);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`${relative} is not installed`);
    }
    dir = parent;
  }
}

/** marimo's compiled stylesheet and the fonts it references, as `marimo.css`. */
function stylesheet(outdir) {
  const assets = path.join(marimo, 'dist', 'assets');
  const cssFiles = fs.readdirSync(assets).filter(f => f.endsWith('.css'));
  const main = cssFiles.find(f => f.startsWith('index-'));
  if (!main) {
    throw new Error(`no index-*.css in ${assets}`);
  }
  const ordered = [main, ...cssFiles.filter(f => f !== main).sort()];
  let css = ordered
    .map(f => fs.readFileSync(path.join(assets, f), 'utf8'))
    .join('\n');
  const referenced = new Set();
  css = css.replace(
    /url\((['"]?)\.\/([^'")?#]+)([^)]*)\)/g,
    (match, quote, file, rest) => {
      if (fs.existsSync(path.join(assets, file))) {
        referenced.add(file);
        return `url(${quote}./${file}${rest})`;
      }
      return match;
    }
  );
  fs.writeFileSync(path.join(outdir, 'marimo.css'), css);
  for (const file of referenced) {
    fs.copyFileSync(path.join(assets, file), path.join(outdir, file));
  }
  console.log(
    `marimo.css: ${(css.length / 1e3).toFixed(0)} kB, ${referenced.size} assets`
  );
}

function types(outdir) {
  fs.copyFileSync(
    path.join(here, 'src', 'index.d.ts'),
    path.join(outdir, 'index.d.ts')
  );
}

// Always beside the sources (the dev servers) and, when the package's lib
// exists (tsc's output, which consumers and the workspace's watchers read),
// beside it too; `--lib` only makes the build a minified one.
const targets = [path.join(pkg, 'src', 'marimo', 'bundle')];
if (lib || fs.existsSync(path.join(pkg, 'lib'))) {
  targets.push(path.join(pkg, 'lib', 'marimo', 'bundle'));
}
for (const outdir of targets) {
  await bundle(outdir);
  bundlerFriendly(outdir);
  wasmBesideChunks(outdir);
  stylesheet(outdir);
  types(outdir);
}
