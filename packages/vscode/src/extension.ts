/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as vscode from 'vscode';
import { NotebookEditorProvider } from './notebookEditor';
import { AuthService } from './auth/authService';
import { TokenProvider } from './auth/tokenProvider';

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  const authService = AuthService.getInstance(context);

  context.subscriptions.push(NotebookEditorProvider.register(context));

  context.subscriptions.push(
    vscode.commands.registerCommand('datalayer.login', async () => {
      await TokenProvider.login();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('datalayer.logout', async () => {
      await TokenProvider.logout();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('datalayer.showAuthStatus', async () => {
      await TokenProvider.showAuthStatus();
    }),
  );

  context.subscriptions.push(authService);
}

/**
 * Deactivate the extension and clear its resources.
 */
export function deactivate() {}
