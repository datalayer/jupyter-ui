import { InputBoxValidationSeverity, window } from 'vscode';

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
