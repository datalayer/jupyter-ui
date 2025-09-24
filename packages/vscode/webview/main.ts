/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module main
 * Entry point for the webview application.
 * Initializes the React-based notebook editor in the webview context.
 */

import { setStylesTarget } from 'typestyle';
import './NotebookVSCode';
import { getNonce } from './utils';

// Fix to apply styled-components style should be set directly at the entry point start.
// Xref: https://github.com/styled-components/styled-components/issues/4258#issuecomment-2449562515
__webpack_nonce__ = getNonce() || '';

// Fix to apply typestyle styles
// Xref: https://github.com/typestyle/typestyle/pull/267#issuecomment-390408796
setStylesTarget(document.querySelector('#typestyle-stylesheet')!);
