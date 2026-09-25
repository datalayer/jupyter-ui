/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The marimo runtime bundle: marimo's frontend, compiled from its published
 * sources, on a Jupyter kernel.
 *
 * `build.mjs` bundles this entry with esbuild, aliasing marimo's `@/` to its
 * `src/` and its Pyodide bridge to {@link "marimo/kernelBridge"}. What comes
 * out is `src/marimo/bundle/index.js` (and `lib/marimo/bundle/index.js`): the
 * whole marimo app, React shared with the host page. `index.d.ts` beside it
 * declares what this file exports.
 *
 * @module marimo/entry
 */

export { mount } from '@/mount';
// Through marimo's own path, so that this is the one module instance marimo
// itself imports: the build substitutes core/wasm/bridge.ts with kernelBridge.ts.
export { connectKernel } from '@/core/wasm/bridge';
export type {
  KernelComm,
  KernelPort,
  MarimoSessionOptions,
} from './kernelBridge';
export { COMM_TARGET, HOST_NAME, kernelHostSource } from './kernelHost';
export { store } from '@/core/state/jotai';
export { notebookAtom } from '@/core/cells/cells';
export { initializePlugins } from '@/plugins/plugins';
