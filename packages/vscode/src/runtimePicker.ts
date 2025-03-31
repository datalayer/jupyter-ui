/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { window, InputBoxValidationSeverity } from 'vscode';

/**
 * Prompt the user to enter an Jupyter Server URL.
 */
export async function setRuntime(): Promise<string | undefined> {
  return window.showInputBox({
    title: 'Select Runtime',
    placeHolder: 'URL to a Jupyter Server',
    validateInput: async text => {
      if (!text) {
        // Ignore empty text
        return null;
      }
      try {
        const url = new URL(text);
        url.pathname = url.pathname.replace(/\/?$/, '') + '/api/';
        // @ts-ignore
        await fetch(url);
        return null;
      } catch (reason) {
        console.error('Invalid URL provided: ', reason);
        return {
          message: 'Invalid Jupyter Server URL',
          severity: InputBoxValidationSeverity.Error,
        };
      }
    },
  });
}
