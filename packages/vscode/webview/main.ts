/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { setStylesTarget } from 'typestyle';
import { main } from './NotebookVSCode';
import { getNonce } from './utils';

// Fix to apply styled-components style should be set directly at the entry point start.
// Xref: https://github.com/styled-components/styled-components/issues/4258#issuecomment-2449562515
__webpack_nonce__ = getNonce() || '';

// Fix to apply typestyle styles
// Xref: https://github.com/typestyle/typestyle/pull/267#issuecomment-390408796
setStylesTarget(document.querySelector('#typestyle-stylesheet')!);

// Just like a regular webpage we need to wait for the webview DOM to load before we can reference any of the HTML elements or toolkit components
window.addEventListener('load', main);
