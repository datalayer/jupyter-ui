// Fix to apply styled-components style
// Xref: https://github.com/styled-components/styled-components/issues/4258#issuecomment-2449562515
__webpack_nonce__ = (window as any).nonce || '';

import { main } from './App';

// Just like a regular webpage we need to wait for the webview
// DOM to load before we can reference any of the HTML elements
// or toolkit components
window.addEventListener('load', main);
