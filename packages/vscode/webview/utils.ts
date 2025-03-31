/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
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
