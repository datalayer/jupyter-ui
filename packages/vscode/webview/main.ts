/**
 * Returns the nonce used in the page, if any.
 *
 * Based on https://github.com/cssinjs/jss/blob/master/packages/jss/src/DomRenderer.js
 * Used by @microsoft/fast design system
 */
function getNonce() {
  const node = document.querySelector('meta[property="csp-nonce"]');
  if (node) {
    return node.getAttribute('content');
  } else {
    return null;
  }
}

// Fix to apply styled-components style should be set directly at the entry point start.
// Xref: https://github.com/styled-components/styled-components/issues/4258#issuecomment-2449562515
__webpack_nonce__ = getNonce() || '';

import { setStylesTarget } from 'typestyle';

// Fix to apply typestyle styles
// Xref: https://github.com/typestyle/typestyle/pull/267#issuecomment-390408796
setStylesTarget(document.querySelector('#typestyle-stylesheet')!);

import { main } from './App';

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener('load', main);
