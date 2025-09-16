/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as vscode from 'vscode';
import { NotebookEditorProvider } from './notebookEditor';
import { AuthService } from './auth/authService';
import { TokenProvider } from './auth/tokenProvider';
import { SpacesTreeProvider } from './spaces/spacesTreeProvider';
import { SpacerApiService } from './spaces/spacerApiService';
import { Document } from './spaces/spaceItem';

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext) {
  const authService = AuthService.getInstance(context);
  const spacerApiService = SpacerApiService.getInstance();

  // Register the notebook editor provider
  context.subscriptions.push(NotebookEditorProvider.register(context));

  // Create and register the spaces tree provider
  const spacesTreeProvider = new SpacesTreeProvider(context);
  const treeView = vscode.window.createTreeView('datalayerSpaces', {
    treeDataProvider: spacesTreeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  // Helper function to update authentication state
  const updateAuthState = () => {
    vscode.commands.executeCommand(
      'setContext',
      'datalayer.authenticated',
      authService.getAuthState().isAuthenticated,
    );
    spacesTreeProvider.refresh();
  };

  // Refresh tree and context when authentication status changes
  const originalLogin = TokenProvider.login;
  TokenProvider.login = async function () {
    const result = await originalLogin.call(TokenProvider);
    updateAuthState();
    return result;
  };

  const originalLogout = TokenProvider.logout;
  TokenProvider.logout = async function () {
    const result = await originalLogout.call(TokenProvider);
    updateAuthState();
    return result;
  };

  // Register authentication commands
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

  // Register tree view commands
  context.subscriptions.push(
    vscode.commands.registerCommand('datalayer.refreshSpaces', () => {
      spacesTreeProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.openDocument',
      async (document: Document) => {
        try {
          if (!document) {
            vscode.window.showErrorMessage('No document selected');
            return;
          }

          // For notebooks, we can open them with our custom editor
          const docName = document.name_t || 'Untitled';
          const isNotebook =
            document.type_s === 'notebook' ||
            document.notebook_extension_s === 'ipynb';

          if (isNotebook) {
            // Create a temporary URI or download the notebook
            // This would need implementation based on how documents are accessed
            vscode.window.showInformationMessage(
              `Opening notebook: ${docName} (ID: ${document.uid})`,
            );
            // TODO: Implement actual notebook opening logic
            // This might involve downloading the notebook content from the API
            // and opening it with the NotebookEditorProvider
          } else {
            vscode.window.showInformationMessage(
              `Opening document: ${docName} (ID: ${document.uid})`,
            );
            // TODO: Implement opening logic for other document types
          }
        } catch (error) {
          console.error('[Datalayer] Error opening document:', error);
          vscode.window.showErrorMessage(
            `Failed to open document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.createNotebookInSpace',
      async spaceItem => {
        try {
          if (!spaceItem?.data?.space) {
            vscode.window.showErrorMessage('Please select a space');
            return;
          }

          const space = spaceItem.data.space;

          // Prompt for notebook name
          const name = await vscode.window.showInputBox({
            prompt: 'Enter notebook name',
            placeHolder: 'My Notebook',
            validateInput: value => {
              if (!value || value.trim().length === 0) {
                return 'Notebook name is required';
              }
              return null;
            },
          });

          if (!name) {
            return;
          }

          // Prompt for description (optional)
          const description = await vscode.window.showInputBox({
            prompt: 'Enter notebook description (optional)',
            placeHolder: 'A brief description of the notebook',
          });

          // Create the notebook
          vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Creating notebook "${name}" in space "${space.name_t}"...`,
              cancellable: false,
            },
            async () => {
              const notebook = await spacerApiService.createNotebook(
                space.uid,
                name,
                description,
              );

              if (notebook) {
                vscode.window.showInformationMessage(
                  `Successfully created notebook "${name}"`,
                );
                spacesTreeProvider.refreshSpace(space.uid);
              } else {
                throw new Error('Failed to create notebook');
              }
            },
          );
        } catch (error) {
          console.error('[Datalayer] Error creating notebook:', error);
          vscode.window.showErrorMessage(
            `Failed to create notebook: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    ),
  );

  // Set initial authentication context for viewsWelcome
  vscode.commands.executeCommand(
    'setContext',
    'datalayer.authenticated',
    authService.getAuthState().isAuthenticated,
  );

  context.subscriptions.push(authService);
}

/**
 * Deactivate the extension and clear its resources.
 */
export function deactivate() {}
