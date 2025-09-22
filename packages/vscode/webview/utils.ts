/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module utils
 * Utility functions for the webview application.
 * Provides helper functions for notebook data manipulation.
 */

/**
 * Loads a notebook from binary data.
 * @param {Uint8Array} raw - Raw binary data
 * @returns {any} Parsed notebook object
 */
export function loadFromBytes(raw: Uint8Array): any {
  const rawContent = new TextDecoder().decode(raw);
  const parsed = JSON.parse(rawContent);
  // Inline html output to fix an issue seen in JupyterLab 4 (prior to 4.2)
  for (const cell of parsed.cells) {
    if (cell.outputs) {
      for (const output of cell.outputs) {
        if (Array.isArray(output.data?.['text/html'])) {
          output.data['text/html'] = output.data['text/html'].join('');
        }
      }
    }
  }
  return parsed;
}

/**
 * Saves a notebook to binary data.
 * @param {any} notebook - Notebook object
 * @returns {Uint8Array} Binary representation
 */
export function saveToBytes(notebook: any): Uint8Array {
  const stringData = JSON.stringify(notebook, null, 2);
  return new TextEncoder().encode(stringData);
}

/**
 * Returns the nonce used in the page, if any.
 *
 * Based on https://github.com/cssinjs/jss/blob/master/packages/jss/src/DomRenderer.js
 * Used by @microsoft/fast design system
 */
export function getNonce() {
  const node = document.querySelector('meta[property="csp-nonce"]');
  if (node) {
    return node.getAttribute('content');
  } else {
    return null;
  }
}
