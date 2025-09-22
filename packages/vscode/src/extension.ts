/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module extension
 * Main extension module for the Datalayer VS Code extension.
 * This module provides integration with the Datalayer platform, including:
 * - Authentication with the Datalayer platform
 * - Custom notebook editor for Jupyter notebooks
 * - Spaces tree view for browsing platform resources
 * - Runtime management for notebook execution
 * - Document synchronization and collaboration features
 */

import * as vscode from 'vscode';
import { NotebookEditorProvider } from './editors/notebookEditor';
import { LexicalEditorProvider } from './editors/lexicalEditor';
import { RuntimeControllerManager } from './runtimes/runtimeControllerManager';
import { AuthService } from './auth/authService';
import { TokenProvider } from './auth/tokenProvider';
import { SpacesTreeProvider } from './spaces/spacesTreeProvider';
import { SpacerApiService } from './spaces/spacerApiService';
import { Document } from './spaces/spaceItem';
import { DocumentBridge } from './spaces/documentBridge';
import { DatalayerFileSystemProvider } from './spaces/datalayerFileSystemProvider';

/**
 * Activates the Datalayer VS Code extension.
 * This function is called when the extension is activated by VS Code.
 * It initializes all services, registers commands, and sets up the UI components.
 *
 * @param {vscode.ExtensionContext} context - The extension context provided by VS Code
 * @returns {void}
 *
 * @remarks
 * The activation process includes:
 * - Initializing authentication services
 * - Registering the virtual file system provider
 * - Setting up the custom notebook editor
 * - Creating the spaces tree view
 * - Registering all extension commands
 *
 * @example
 * // This function is automatically called by VS Code when the extension activates
 * // based on the activation events defined in package.json
 */
export function activate(context: vscode.ExtensionContext): void {
  const authService = AuthService.getInstance(context);
  const spacerApiService = SpacerApiService.getInstance();
  const documentBridge = DocumentBridge.getInstance(context);
  const fileSystemProvider = DatalayerFileSystemProvider.getInstance();

  // Register the virtual file system provider for cleaner paths
  context.subscriptions.push(
    vscode.workspace.registerFileSystemProvider(
      'datalayer',
      fileSystemProvider,
      {
        isCaseSensitive: true,
        isReadonly: false,
      },
    ),
  );

  // Register the notebook editor provider
  context.subscriptions.push(NotebookEditorProvider.register(context));

  // Register the lexical editor provider
  context.subscriptions.push(LexicalEditorProvider.register(context));

  // Initialize the runtime controller manager for dynamic kernel picker integration
  const runtimeControllerManager = new RuntimeControllerManager(context);
  context.subscriptions.push(runtimeControllerManager);

  // Initialize controllers (this will create initial controllers based on available runtimes)
  runtimeControllerManager.initialize().catch(error => {
    console.error(
      '[Extension] Failed to initialize runtime controller manager:',
      error,
    );
  });
  console.log('[Extension] Runtime controller manager initialized');

  // Create and register the spaces tree provider
  const spacesTreeProvider = new SpacesTreeProvider(context);
  const treeView = vscode.window.createTreeView('datalayerSpaces', {
    treeDataProvider: spacesTreeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  /**
   * Updates the authentication state in VS Code's context.
   * This helper function synchronizes the authentication status with the UI,
   * updating context variables and refreshing the spaces tree view.
   *
   * @private
   * @returns {void}
   */
  const updateAuthState = (): void => {
    vscode.commands.executeCommand(
      'setContext',
      'datalayer.authenticated',
      authService.getAuthState().isAuthenticated,
    );
    spacesTreeProvider.refresh();

    // Refresh runtime controllers when authentication state changes
    runtimeControllerManager.forceRefresh().catch(error => {
      console.error(
        '[Extension] Failed to refresh runtime controllers on auth state change:',
        error,
      );
    });
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

  // Register runtime controller refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.refreshRuntimeControllers',
      async (selectRuntimeUid?: string) => {
        console.log(
          '[Extension] Runtime controller refresh triggered',
          selectRuntimeUid ? `(select: ${selectRuntimeUid})` : '',
        );
        return await runtimeControllerManager.forceRefresh(selectRuntimeUid);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.openDocument',
      async (document: Document, spaceName?: string) => {
        try {
          if (!document) {
            vscode.window.showErrorMessage('No document selected');
            return;
          }

          const docName =
            document.name_t ||
            document.notebook_name_s ||
            document.document_name_s ||
            'Untitled';
          const isNotebook =
            document.type_s === 'notebook' ||
            document.notebook_extension_s === 'ipynb';
          const isLexical =
            document.document_format_s === 'lexical' ||
            document.document_extension_s === 'lexical';
          const isCell = document.type_s === 'cell';

          if (isNotebook) {
            // Show progress while downloading notebook
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Opening notebook: ${docName}`,
                cancellable: false,
              },
              async progress => {
                progress.report({
                  increment: 0,
                  message: 'Downloading notebook content...',
                });

                // Use DocumentBridge to handle the download and caching
                const uri = await documentBridge.openDocument(
                  document,
                  undefined,
                  spaceName,
                );

                // For Datalayer notebooks, we don't create a runtime automatically
                // The notebook will use collaboration with the document UID
                console.log(
                  '[Datalayer] Opening notebook with collaboration - document ID:',
                  document.uid || document.id,
                );

                progress.report({
                  increment: 75,
                  message: 'Opening notebook editor...',
                });

                // Open the notebook with our custom editor
                // The notebook will connect to the runtime in collaborative mode
                // which provides automatic saving
                await vscode.commands.executeCommand(
                  'vscode.openWith',
                  uri,
                  'datalayer.jupyter-notebook',
                );

                // Set a better tab title after opening
                // The tab will show the document name and space
                // Unfortunately VS Code doesn't allow changing tab labels directly
                // The title will be based on the filename, but at least it won't have the UID

                progress.report({ increment: 100, message: 'Done!' });
              },
            );
          } else if (isLexical) {
            // Show progress while downloading lexical document
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Opening lexical document: ${docName}`,
                cancellable: false,
              },
              async progress => {
                progress.report({
                  increment: 0,
                  message: 'Downloading document content...',
                });

                // Use DocumentBridge to handle the download and caching
                const uri = await documentBridge.openDocument(
                  document,
                  undefined,
                  spaceName,
                );

                progress.report({
                  increment: 50,
                  message: 'Opening document in read-only mode...',
                });

                // Open the lexical document with our custom editor in read-only mode
                await vscode.commands.executeCommand(
                  'vscode.openWith',
                  uri,
                  'datalayer.lexical-editor',
                );

                progress.report({ increment: 100, message: 'Done!' });
              },
            );
          } else if (isCell) {
            vscode.window.showInformationMessage(
              `Cell viewer coming soon: ${docName}`,
            );
            // TODO: Implement cell viewer
          } else {
            vscode.window.showInformationMessage(
              `Document type not supported: ${docName}`,
            );
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

  // Create Space command
  context.subscriptions.push(
    vscode.commands.registerCommand('datalayer.createSpace', async () => {
      try {
        // Prompt for space name
        const name = await vscode.window.showInputBox({
          prompt: 'Enter space name',
          placeHolder: 'My Space',
          validateInput: value => {
            if (!value || value.trim().length === 0) {
              return 'Space name is required';
            }
            return null;
          },
        });

        if (!name) {
          return;
        }

        // Prompt for description (optional)
        const description = await vscode.window.showInputBox({
          prompt: 'Enter space description (optional)',
          placeHolder: 'A brief description of the space',
        });

        // Ask if the space should be public
        const visibility = await vscode.window.showQuickPick(
          ['Private', 'Public'],
          {
            placeHolder: 'Select space visibility',
            title: 'Space Visibility',
          },
        );

        if (!visibility) {
          return;
        }

        const isPublic = visibility === 'Public';

        // Create the space
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Creating ${visibility.toLowerCase()} space "${name}"...`,
            cancellable: false,
          },
          async () => {
            const space = await spacerApiService.createSpace(
              name,
              description,
              isPublic,
            );

            if (space) {
              vscode.window.showInformationMessage(
                `Successfully created ${visibility.toLowerCase()} space "${name}"`,
              );
              spacesTreeProvider.refresh();
            } else {
              throw new Error('Failed to create space');
            }
          },
        );
      } catch (error) {
        console.error('[Datalayer] Error creating space:', error);
        vscode.window.showErrorMessage(
          `Failed to create space: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }),
  );

  // Create Notebook in Space command
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
          await vscode.window.withProgress(
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

  // Create Lexical Document in Space command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.createLexicalInSpace',
      async spaceItem => {
        try {
          if (!spaceItem?.data?.space) {
            vscode.window.showErrorMessage('Please select a space');
            return;
          }

          const space = spaceItem.data.space;

          // Prompt for document name
          const name = await vscode.window.showInputBox({
            prompt: 'Enter document name',
            placeHolder: 'My Document',
            validateInput: value => {
              if (!value || value.trim().length === 0) {
                return 'Document name is required';
              }
              return null;
            },
          });

          if (!name) {
            return;
          }

          // Prompt for description (optional)
          const description = await vscode.window.showInputBox({
            prompt: 'Enter document description (optional)',
            placeHolder: 'A brief description of the document',
          });

          // Create the lexical document
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Creating lexical document "${name}" in space "${space.name_t}"...`,
              cancellable: false,
            },
            async () => {
              const document = await spacerApiService.createLexicalDocument(
                space.uid,
                name,
                description,
              );

              if (document) {
                vscode.window.showInformationMessage(
                  `Successfully created lexical document "${name}"`,
                );
                spacesTreeProvider.refreshSpace(space.uid);
              } else {
                throw new Error('Failed to create lexical document');
              }
            },
          );
        } catch (error) {
          console.error('[Datalayer] Error creating lexical document:', error);
          vscode.window.showErrorMessage(
            `Failed to create lexical document: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    ),
  );

  // Rename Item command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.renameItem',
      async (item: any) => {
        try {
          if (!item?.data?.document) {
            vscode.window.showErrorMessage(
              'Please select a document to rename',
            );
            return;
          }

          const document = item.data.document;
          const currentName =
            document.name_t ||
            document.notebook_name_s ||
            document.document_name_s ||
            'Untitled';

          // Prompt for new name
          const newName = await vscode.window.showInputBox({
            prompt: 'Enter new name',
            value: currentName,
            validateInput: value => {
              if (!value || value.trim().length === 0) {
                return 'Name is required';
              }
              return null;
            },
          });

          if (!newName || newName === currentName) {
            return;
          }

          // Determine item type
          const isNotebook =
            document.type_s === 'notebook' ||
            document.notebook_extension_s === 'ipynb';
          const itemType = isNotebook ? 'notebook' : 'document';

          // Rename the item
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Renaming "${currentName}" to "${newName}"...`,
              cancellable: false,
            },
            async () => {
              // Pass the existing description or empty string
              const existingDescription = document.description_t || '';
              const success = await spacerApiService.updateItemName(
                document.uid,
                itemType,
                newName,
                existingDescription,
              );

              if (success) {
                vscode.window.showInformationMessage(
                  `Successfully renamed to "${newName}"`,
                );
                // Refresh the parent space
                spacesTreeProvider.refresh();
              } else {
                throw new Error('Failed to rename item');
              }
            },
          );
        } catch (error) {
          console.error('[Datalayer] Error renaming item:', error);
          vscode.window.showErrorMessage(
            `Failed to rename item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    ),
  );

  // Delete Item command
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.deleteItem',
      async (item: any) => {
        try {
          if (!item?.data?.document) {
            vscode.window.showErrorMessage(
              'Please select a document to delete',
            );
            return;
          }

          const document = item.data.document;
          const itemName =
            document.name_t ||
            document.notebook_name_s ||
            document.document_name_s ||
            'Untitled';

          // Confirm deletion
          const confirmation = await vscode.window.showWarningMessage(
            `Are you sure you want to delete "${itemName}"?`,
            'Delete',
            'Cancel',
          );

          if (confirmation !== 'Delete') {
            return;
          }

          // Delete the item
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `Deleting "${itemName}"...`,
              cancellable: false,
            },
            async () => {
              const success = await spacerApiService.deleteItem(document.uid);

              if (success) {
                vscode.window.showInformationMessage(
                  `Successfully deleted "${itemName}"`,
                );
                // Refresh the tree
                spacesTreeProvider.refresh();
              } else {
                throw new Error('Failed to delete item');
              }
            },
          );
        } catch (error) {
          console.error('[Datalayer] Error deleting item:', error);
          vscode.window.showErrorMessage(
            `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      },
    ),
  );

  // Register notebook controller status commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.showNotebookControllerStatus',
      () => {
        const controllers = runtimeControllerManager.getActiveControllers();

        if (controllers.length === 0) {
          vscode.window.showInformationMessage(
            'No active Datalayer runtime controllers. Login to see available runtimes.',
          );
          return;
        }

        // Show status for all active controllers
        let statusMessage = `Active Datalayer Controllers (${controllers.length}):\n\n`;

        for (const controller of controllers) {
          const config = controller.config;
          const runtime = controller.activeRuntime;

          statusMessage += `• ${config.displayName}\n`;

          if (runtime) {
            statusMessage += `  Pod: ${runtime.pod_name || 'N/A'}\n`;
            statusMessage += `  Status: ${runtime.status || 'Unknown'}\n`;
            statusMessage += `  Environment: ${runtime.environment_name || runtime.environment_title || 'default'}\n`;
            if (runtime.credits_used !== undefined && runtime.credits_limit) {
              statusMessage += `  Credits: ${runtime.credits_used}/${runtime.credits_limit}\n`;
            }
          } else {
            statusMessage += `  Type: ${config.type}\n`;
            if (config.environmentName) {
              statusMessage += `  Environment: ${config.environmentName}\n`;
            }
          }
          statusMessage += '\n';
        }

        vscode.window.showInformationMessage(statusMessage);
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      'datalayer.restartNotebookRuntime',
      async () => {
        try {
          if (runtimeControllerManager) {
            const controllers = runtimeControllerManager.getActiveControllers();
            const runtimeControllers = controllers.filter(c => c.activeRuntime);

            if (runtimeControllers.length === 0) {
              vscode.window.showInformationMessage(
                'No active runtimes to restart.',
              );
              return;
            }

            // If only one runtime, restart it directly
            if (runtimeControllers.length === 1) {
              const controller = runtimeControllers[0];
              const runtime = controller.activeRuntime!;

              const restart = await vscode.window.showWarningMessage(
                `Restart runtime "${runtime.pod_name || runtime.uid}"? This will interrupt any running executions.`,
                'Restart',
                'Cancel',
              );

              if (restart === 'Restart') {
                // Dispose the controller to force reconnection
                controller.dispose();

                // Refresh controllers to recreate them
                await runtimeControllerManager.forceRefresh();

                vscode.window.showInformationMessage(
                  'Runtime restarted. Controllers have been refreshed.',
                );
              }
            } else {
              // Multiple runtimes - show picker
              const runtimeNames = runtimeControllers.map(c => {
                const runtime = c.activeRuntime!;
                return runtime.pod_name || runtime.uid;
              });

              const selectedRuntime = await vscode.window.showQuickPick(
                runtimeNames,
                {
                  placeHolder: 'Select runtime to restart',
                },
              );

              if (selectedRuntime) {
                const controller = runtimeControllers.find(
                  c =>
                    (c.activeRuntime!.pod_name || c.activeRuntime!.uid) ===
                    selectedRuntime,
                );

                if (controller) {
                  const restart = await vscode.window.showWarningMessage(
                    `Restart runtime "${selectedRuntime}"? This will interrupt any running executions.`,
                    'Restart',
                    'Cancel',
                  );

                  if (restart === 'Restart') {
                    controller.dispose();
                    await runtimeControllerManager.forceRefresh();

                    vscode.window.showInformationMessage(
                      `Runtime "${selectedRuntime}" restarted. Controllers have been refreshed.`,
                    );
                  }
                }
              }
            }
          } else {
            vscode.window.showInformationMessage(
              'No active runtimes to restart.',
            );
          }
        } catch (error) {
          vscode.window.showErrorMessage(`Failed to restart runtime: ${error}`);
        }
      },
    ),
  );

  // Note: datalayer.refreshRuntimeControllers command is already registered above

  // Set initial authentication context for viewsWelcome
  vscode.commands.executeCommand(
    'setContext',
    'datalayer.authenticated',
    authService.getAuthState().isAuthenticated,
  );

  context.subscriptions.push(authService);

  // Clean up document bridge on deactivation
  context.subscriptions.push({
    dispose: () => {
      documentBridge.dispose();
    },
  });
}

/**
 * Deactivates the extension and cleans up resources.
 * This function is called when the extension is deactivated or VS Code is closing.
 * All disposables are automatically cleaned up through the context.subscriptions array.
 *
 * @returns {void}
 *
 * @remarks
 * The cleanup process is handled automatically by VS Code's disposal mechanism.
 * All services and UI components registered in context.subscriptions are disposed.
 */
export function deactivate(): void {
  // Cleanup is handled by the disposables in context.subscriptions
}
