/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A typesetting engine in the browser: Typst compiled to WebAssembly,
 * loaded from a CDN on first use (nothing is bundled; the compiler is a
 * 20 MB download, cached by the browser). Given Typst markup and the files
 * it references, it returns a PDF.
 *
 * The engine is `@myriaddreamin/typst.ts`' `$typst` snippet, fetched
 * through jsDelivr's bundling endpoint so its own imports resolve. Both
 * URLs can be pointed at a self-hosted copy.
 *
 * @module convert/typst/TypstEngine
 */

export interface TypstEngineOptions {
  /** The ES module exporting `$typst`. */
  moduleUrl?: string;
  /** The compiler's WebAssembly binary. */
  wasmUrl?: string;
}

export const TYPST_TS_VERSION = '0.7.0';

export const DEFAULT_TYPST_MODULE_URL = `https://cdn.jsdelivr.net/npm/@myriaddreamin/typst.ts@${TYPST_TS_VERSION}/dist/esm/contrib/snippet.mjs/+esm`;

export const DEFAULT_TYPST_WASM_URL = `https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@${TYPST_TS_VERSION}/pkg/typst_ts_web_compiler_bg.wasm`;

/** Something that turns Typst markup into a PDF. */
export interface TypstEngine {
  compile(main: string, files?: Map<string, Uint8Array>): Promise<Uint8Array>;
}

interface TypstSnippet {
  setCompilerInitOptions(options: { getModule: () => string }): void;
  resetShadow(): void;
  mapShadow(path: string, content: Uint8Array): Promise<void> | void;
  pdf(options: { mainContent: string }): Promise<Uint8Array>;
}

const engines = new Map<string, Promise<TypstEngine>>();

/** Import a module by URL without the bundler trying to resolve it. */
function importUrl(url: string): Promise<{ $typst: TypstSnippet }> {
  const importer = new Function('url', 'return import(url)') as (
    url: string,
  ) => Promise<{ $typst: TypstSnippet }>;
  return importer(url);
}

/**
 * The engine, loaded once per module URL. Rejects where there is no
 * network or no WebAssembly.
 */
export function loadTypstEngine(
  options: TypstEngineOptions = {},
): Promise<TypstEngine> {
  const moduleUrl = options.moduleUrl ?? DEFAULT_TYPST_MODULE_URL;
  const wasmUrl = options.wasmUrl ?? DEFAULT_TYPST_WASM_URL;
  const cached = engines.get(moduleUrl);
  if (cached) {
    return cached;
  }
  const loading = importUrl(moduleUrl).then(({ $typst }) => {
    $typst.setCompilerInitOptions({ getModule: () => wasmUrl });
    let queue: Promise<unknown> = Promise.resolve();
    const engine: TypstEngine = {
      compile(main, files) {
        // One compilation at a time: the shadow files are shared state.
        const run = queue.then(async () => {
          $typst.resetShadow();
          if (files) {
            for (const [path, content] of files) {
              await $typst.mapShadow(
                path.startsWith('/') ? path : `/${path}`,
                content,
              );
            }
          }
          return $typst.pdf({ mainContent: main });
        });
        queue = run.catch(() => undefined);
        return run;
      },
    };
    return engine;
  });
  loading.catch(() => engines.delete(moduleUrl));
  engines.set(moduleUrl, loading);
  return loading;
}

export function isTypstEngine(value: unknown): value is TypstEngine {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as TypstEngine).compile === 'function'
  );
}
