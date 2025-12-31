/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lite entry point - exports JupyterLite-related modules including kernel extensions.
 */

// Re-export lite modules
export * from './jupyter/lite';

// Re-export kernel extensions
export { default as pyodideKernelExtension } from './jupyter/lite/pyodide-kernel-extension';
export { default as javascriptKernelExtension } from './jupyter/lite/javascript-kernel-extension';
