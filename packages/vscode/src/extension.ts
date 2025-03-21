import * as vscode from 'vscode';
import { NotebookEditorProvider } from './notebookEditor';

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(NotebookEditorProvider.register(context));
}

/**
 * Deactivate the extension and clear its resources.
 */
export function deactivate() {}
