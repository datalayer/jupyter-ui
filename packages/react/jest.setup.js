/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * The browser APIs jsdom does not implement.
 *
 * JupyterLab ships the shim — `DragEvent`, `ResizeObserver`,
 * `IntersectionObserver`, `Range.createContextualFragment` and the rest —
 * because Lumino and CodeMirror reach for them at import time, so a test that
 * so much as imports a notebook store dies without it.
 *
 * It is applied only to the tests that asked for a DOM. The suites here are
 * mostly about the platform-agnostic half of these packages — schemas,
 * operations, scene data — which run in Node, where the shim's first line
 * would throw for want of a `window`. A file opts in with
 * `@jest-environment jsdom` at the top.
 */
if (typeof window !== 'undefined') {
  require('@jupyterlab/testing/lib/jest-shim.js');
}
