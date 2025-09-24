/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as vscode from 'vscode';
import { WebSocket, RawData } from 'ws';
import { Disposable, disposeAll } from '../dispose';
import { getNonce } from '../util';
import { setRuntime } from '../runtimes/runtimePicker';
import {
  RuntimesApiService,
  type RuntimeResponse,
} from '../runtimes/runtimesApiService';
import { AuthService } from '../auth/authService';
import type { ExtensionMessage } from '../messages';

/**
 * Define the type of edits used in notebook files.
 */
interface NotebookEdit {
  readonly type: 'content-update';
  readonly content: Uint8Array;
}

interface NotebookDocumentDelegate {
  getFileData(): Promise<Uint8Array>;
  getWebviewPanel?: () => vscode.WebviewPanel | undefined;
}

/**
 * Define the document (the data model) used for notebook files.
 */
class NotebookDocument extends Disposable implements vscode.CustomDocument {
  static async create(
    uri: vscode.Uri,
    backupId: string | undefined,
    delegate: NotebookDocumentDelegate,
  ): Promise<NotebookDocument | PromiseLike<NotebookDocument>> {
    // If we have a backup, read that. Otherwise read the resource from the workspace
    const dataFile =
      typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
    const fileData = await NotebookDocument.readFile(dataFile);
    return new NotebookDocument(uri, fileData, delegate);
  }

  private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') {
      return new Uint8Array();
    }
    return new Uint8Array(await vscode.workspace.fs.readFile(uri));
  }

  private readonly _uri: vscode.Uri;

  private _documentData: Uint8Array;
  private _edits: NotebookEdit[] = [];
  private _savedEdits: NotebookEdit[] = [];

  private readonly _delegate: NotebookDocumentDelegate;

  private constructor(
    uri: vscode.Uri,
    initialContent: Uint8Array,
    delegate: NotebookDocumentDelegate,
  ) {
    super();
    this._uri = uri;
    this._documentData = initialContent;
    this._delegate = delegate;
  }

  public get uri() {
    return this._uri;
  }

  public get documentData(): Uint8Array {
    return this._documentData;
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>(),
  );
  /**
   * Fired when the document is disposed of.
   */
  public readonly onDidDispose = this._onDidDispose.event;

  private readonly _onDidChangeDocument = this._register(
    new vscode.EventEmitter<{
      readonly content?: Uint8Array;
      readonly edits: readonly NotebookEdit[];
    }>(),
  );
  /**
   * Fired to notify webviews that the document has changed.
   */
  public readonly onDidChangeContent = this._onDidChangeDocument.event;

  private readonly _onDidChange = this._register(
    new vscode.EventEmitter<{
      readonly label: string;
      undo(): void;
      redo(): void;
    }>(),
  );
  /**
   * Fired to tell VS Code that an edit has occurred in the document.
   *
   * This updates the document's dirty indicator.
   */
  public readonly onDidChange = this._onDidChange.event;

  /**
   * Called by VS Code when there are no more references to the document.
   *
   * This happens when all editors for it have been closed.
   */
  dispose(): void {
    this._onDidDispose.fire();
    super.dispose();
  }

  /**
   * Called when the user edits the document in a webview.
   *
   * This fires an event to notify VS Code that the document has been edited.
   */
  makeEdit(edit: NotebookEdit) {
    this._edits.push(edit);

    // Update the document data if it's a content update
    if (edit.type === 'content-update') {
      this._documentData = edit.content;
    }

    this._onDidChange.fire({
      label: 'Edit',
      undo: async () => {
        this._edits.pop();
        // Restore previous content if available
        if (this._edits.length > 0) {
          const lastEdit = this._edits[this._edits.length - 1];
          if (lastEdit.type === 'content-update') {
            this._documentData = lastEdit.content;
          }
        }
        this._onDidChangeDocument.fire({
          edits: this._edits,
          content: this._documentData,
        });
      },
      redo: async () => {
        this._edits.push(edit);
        if (edit.type === 'content-update') {
          this._documentData = edit.content;
        }
        this._onDidChangeDocument.fire({
          edits: this._edits,
          content: this._documentData,
        });
      },
    });

    this._onDidChangeDocument.fire({
      edits: this._edits,
      content: this._documentData,
    });
  }

  /**
   * Called by VS Code when the user saves the document.
   */
  async save(cancellation: vscode.CancellationToken): Promise<void> {
    await this.saveAs(this.uri, cancellation);
    this._savedEdits = Array.from(this._edits);
  }

  /**
   * Called by VS Code when the user saves the document to a new location.
   */
  async saveAs(
    targetResource: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    // For Datalayer notebooks, always use original data (read-only)
    if (this.uri.scheme === 'datalayer') {
      const fileData = this._documentData;
      if (cancellation.isCancellationRequested) {
        return;
      }
      await vscode.workspace.fs.writeFile(targetResource, fileData);
      return;
    }

    // For local notebooks, get current data from the delegate (webview)
    try {
      const fileData = await this._delegate.getFileData();
      if (cancellation.isCancellationRequested) {
        return;
      }
      await vscode.workspace.fs.writeFile(targetResource, fileData);

      // Update our local copy of the data
      this._documentData = fileData;

      // Clear the edits after successful save
      this._savedEdits = Array.from(this._edits);
      this._edits = [];
    } catch (error) {
      console.error('[NotebookDocument] Error saving document:', error);
      throw error;
    }
  }

  /**
   * Called by VS Code when the user calls `revert` on a document.
   */
  async revert(_cancellation: vscode.CancellationToken): Promise<void> {
    const diskContent = await NotebookDocument.readFile(this.uri);
    this._documentData = diskContent;
    this._edits = this._savedEdits;
    this._onDidChangeDocument.fire({
      content: diskContent,
      edits: this._edits,
    });
  }

  /**
   * Called by VS Code to backup the edited document.
   *
   * These backups are used to implement hot exit.
   */
  async backup(
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<vscode.CustomDocumentBackup> {
    await this.saveAs(destination, cancellation);

    return {
      id: destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(destination);
        } catch {
          // noop
        }
      },
    };
  }
}

/**
 * Provider for notebook editors.
 *
 * This provider demonstrates:
 *
 * - How to implement a custom editor for binary files.
 * - Setting up the initial webview for a custom editor.
 * - Loading scripts and styles in a custom editor.
 * - Communication between VS Code and the custom editor.
 * - Using CustomDocuments to store information that is shared between multiple custom editors.
 * - Implementing save, undo, redo, and revert.
 * - Backing up a custom editor.
 */
export class NotebookEditorProvider
  implements vscode.CustomEditorProvider<NotebookDocument>
{
  private static newNotebookFileId = 1;

  /**
   * Registers the notebook editor provider
   * @param context Extension context
   * @returns Disposable for cleanup
   */
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand('datalayer.jupyter-notebook-new', () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          'Creating new Datalayer notebook files currently requires opening a workspace',
        );
        return;
      }

      const uri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        `new-${NotebookEditorProvider.newNotebookFileId++}.ipynb`,
      ).with({ scheme: 'untitled' });

      vscode.commands.executeCommand(
        'vscode.openWith',
        uri,
        NotebookEditorProvider.viewType,
      );
    });

    return vscode.window.registerCustomEditorProvider(
      NotebookEditorProvider.viewType,
      new NotebookEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: false,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    );
  }

  private static readonly viewType = 'datalayer.jupyter-notebook';

  /**
   * Tracks all known webviews
   */
  private readonly webviews = new WebviewCollection();

  /**
   * Tracks websocket
   */
  private readonly _websockets = new Map<string, WebSocket>();

  private _requestId = 1;
  private readonly _callbacks = new Map<string, (response: any) => void>();
  private readonly _context: vscode.ExtensionContext;

  /**
   * Creates a new NotebookEditorProvider
   * @param context Extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
  }

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken,
  ): Promise<NotebookDocument> {
    const document: NotebookDocument = await NotebookDocument.create(
      uri,
      openContext.backupId,
      {
        getFileData: async () => {
          const webviewsForDocument = Array.from(
            this.webviews.get(document.uri),
          );
          if (!webviewsForDocument.length) {
            throw new Error('Could not find webview to save for');
          }
          const panel = webviewsForDocument[0];
          const response = await this.postMessageWithResponse<number[]>(
            panel,
            'getFileData',
            {},
          );
          return new Uint8Array(response);
        },
      },
    );

    const listeners: vscode.Disposable[] = [];

    listeners.push(
      document.onDidChange(
        (e: { readonly label: string; undo(): void; redo(): void }) => {
          // Tell VS Code that the document has been edited by the user.
          this._onDidChangeCustomDocument.fire({
            document,
            ...e,
          });
        },
      ),
    );

    listeners.push(
      document.onDidChangeContent(
        (e: {
          readonly content?: Uint8Array;
          readonly edits: readonly NotebookEdit[];
        }) => {
          // Update all webviews when the document changes
          for (const webviewPanel of this.webviews.get(document.uri)) {
            this.postMessage(webviewPanel, 'update', {
              edits: e.edits,
              content: e.content,
            });
          }
        },
      ),
    );

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  async resolveCustomEditor(
    document: NotebookDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    // Add the webview to our internal set of active webviews
    this.webviews.add(document.uri, webviewPanel);

    // Setup initial content for the webview
    webviewPanel.webview.options = {
      enableScripts: true,
    };
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    webviewPanel.webview.onDidReceiveMessage(e =>
      this.onMessage(webviewPanel, document, e),
    );

    // Listen for theme changes
    const themeChangeDisposable = vscode.window.onDidChangeActiveColorTheme(
      () => {
        const theme =
          vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
            ? 'dark'
            : 'light';
        this.postMessage(webviewPanel, 'theme-change', { theme });
      },
    );

    webviewPanel.onDidDispose(() => {
      themeChangeDisposable.dispose();
    });

    // Wait for the webview to be properly ready before we init
    webviewPanel.webview.onDidReceiveMessage(async e => {
      if (e.type === 'ready') {
        // Detect VS Code theme
        const theme =
          vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark
            ? 'dark'
            : 'light';

        if (document.uri.scheme === 'untitled') {
          this.postMessage(webviewPanel, 'init', {
            untitled: true,
            editable: true,
            theme,
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(
            document.uri.scheme,
          );

          // Check if this is a Datalayer notebook (from spaces)
          const isDatalayerNotebook = document.uri.scheme === 'datalayer';

          // Get document ID and server info for Datalayer notebooks
          let documentId: string | undefined;
          let serverUrl: string | undefined;
          let token: string | undefined;

          if (isDatalayerNotebook) {
            // Get the Datalayer server configuration
            const config = vscode.workspace.getConfiguration('datalayer');
            serverUrl = config.get<string>(
              'serverUrl',
              'https://prod1.datalayer.run',
            );

            // Get the authentication token
            const AuthService = await import('../auth/authService');
            const authService = AuthService.AuthService.getInstance();
            const jwtToken = await authService.getToken();
            if (jwtToken) {
              token = jwtToken;
            }

            // First try to get metadata from document bridge
            const DocumentBridge = await import('../spaces/documentBridge');
            const documentBridge = DocumentBridge.DocumentBridge.getInstance();
            const metadata = documentBridge.getDocumentMetadata(document.uri);

            if (metadata && metadata.document.uid) {
              documentId = metadata.document.uid;
              console.log(
                '[NotebookEditor] Got document ID from metadata:',
                documentId,
              );
            } else {
              // Fallback: try to extract document ID from the filename
              const filename = document.uri.path.split('/').pop() || '';
              const match = filename.match(/_([a-zA-Z0-9-]+)\.ipynb$/);
              documentId = match ? match[1] : undefined;

              if (documentId) {
                console.log(
                  '[NotebookEditor] Got document ID from filename fallback:',
                  documentId,
                );
              }
            }
          }

          this.postMessage(webviewPanel, 'init', {
            value: document.documentData,
            editable,
            isDatalayerNotebook,
            theme,
            documentId,
            serverUrl,
            token,
          });
        }
      }
    });
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<NotebookDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  public saveCustomDocument(
    document: NotebookDocument,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.save(cancellation);
  }

  public saveCustomDocumentAs(
    document: NotebookDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.saveAs(destination, cancellation);
  }

  public revertCustomDocument(
    document: NotebookDocument,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.revert(cancellation);
  }

  public backupCustomDocument(
    document: NotebookDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Thenable<vscode.CustomDocumentBackup> {
    return document.backup(context.destination, cancellation);
  }

  /**
   * Get the static HTML used for in our editor's webviews.
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview.js'),
    );

    // Get the codicon font file from node_modules
    const codiconFontUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        '..',
        '..',
        'node_modules',
        '@vscode',
        'codicons',
        'dist',
        'codicon.ttf',
      ),
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    /* 
      FIXME we use very light Content Security Policy;
      - any inline style are allowed
      - any data: image are allowed
     */
    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">

        <head>

          <meta charset="UTF-8">

          <meta name="viewport" content="width=device-width, initial-scale=1.0">

          <title>Datalayer Notebook</title>

          <!--
            Workaround for injected typestyle
            Xref: https://github.com/typestyle/typestyle/pull/267#issuecomment-390408796
          -->
          <style id="typestyle-stylesheet" nonce="${nonce}"></style>

          <!-- Custom styles for animated icons and codicons -->
          <style nonce="${nonce}">
            /* Load the codicon font */
            @font-face {
              font-family: 'codicon';
              src: url('${codiconFontUri}') format('truetype');
              font-weight: normal;
              font-style: normal;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }

            .codicon-modifier-spin {
              animation: spin 1s linear infinite;
            }

            /* Use VS Code's built-in codicons */
            .codicon {
              font-family: 'codicon';
              display: inline-block;
              font-style: normal;
              font-weight: normal;
              text-decoration: none;
              text-rendering: auto;
              text-align: center;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              user-select: none;
              -webkit-user-select: none;
            }

            /* Icon definitions */
            .codicon-run:before { content: '\\eb9d' }
            .codicon-run-above:before { content: '\\ec06' }
            .codicon-run-below:before { content: '\\ec07' }
            .codicon-add:before { content: '\\ea60' }
            .codicon-clear-all:before { content: '\\ebaa' }
            .codicon-debug-restart:before { content: '\\ebb0' }
            .codicon-debug-stop:before { content: '\\ead5' }
            .codicon-circle-filled:before { content: '\\ea71' }
            .codicon-loading:before { content: '\\eb19' }
            .codicon-circle-slash:before { content: '\\eabd' }
            .codicon-circle-outline:before { content: '\\eabc' }
            .codicon-chevron-down:before { content: '\\eab4' }

            /* Fix body and html background */
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
              background-color: var(--vscode-editor-background);
              overflow: hidden;
            }

            /* Ensure notebook container fills the viewport */
            #notebook-editor {
              height: 100vh;
              width: 100vw;
              background-color: var(--vscode-editor-background);
              margin: 0;
              padding: 0;
            }
          </style>

          <meta property="csp-nonce" content="${nonce}" />

          <!--
          Use a content security policy to only allow loading images from https or from our extension directory, and only allow scripts that have a specific nonce.
          -->
          <!--
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; style-src ${webview.cspSource} 'nonce-${nonce}'; script-src 'nonce-${nonce}';" />
          -->
          <!--
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob: data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
          -->

        </head>

        <body>
          <div id="notebook-editor"></div>
          <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>

      </html>`;
  }

  private postMessageWithResponse<R = unknown>(
    panel: vscode.WebviewPanel,
    type: string,
    body: any,
  ): Promise<R> {
    const requestId = (this._requestId++).toString();
    const p = new Promise<R>(resolve =>
      this._callbacks.set(requestId, resolve),
    );
    panel.webview.postMessage({ type, requestId, body });
    return p;
  }

  private postMessage(
    panel: vscode.WebviewPanel,
    type: string,
    body: any,
    id?: string,
  ): void {
    panel.webview.postMessage({ type, body, id });
  }

  private async handleRuntimeSelection(
    webview: vscode.WebviewPanel,
    message: ExtensionMessage,
  ) {
    try {
      const runtimesApi = RuntimesApiService.getInstance(this._context);
      const authService = AuthService.getInstance(this._context);

      // Check if authenticated
      const authState = authService.getAuthState();
      if (!authState.isAuthenticated) {
        vscode.window.showErrorMessage('Please login to Datalayer first');
        return;
      }

      // Fetch existing runtimes
      let runtimes: RuntimeResponse[] = [];
      try {
        runtimes = await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Loading runtimes...',
            cancellable: false,
          },
          async () => {
            return await runtimesApi.listRuntimes();
          },
        );
      } catch (error) {
        console.error('[NotebookEditor] Error loading runtimes:', error);

        // Check if it's a token expiration error
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('expired') || errorMessage.includes('401')) {
          vscode.window
            .showErrorMessage(
              'Authentication expired. Please logout and login again.',
              'Logout',
            )
            .then(selection => {
              if (selection === 'Logout') {
                vscode.commands.executeCommand('datalayer.logout');
              }
            });
        } else {
          vscode.window.showErrorMessage(
            `Failed to load runtimes: ${errorMessage}`,
          );
        }
        return;
      }

      // Create quick pick items
      const items: vscode.QuickPickItem[] = [];

      // Add existing runtimes
      if (runtimes && runtimes.length > 0) {
        runtimes.forEach(runtime => {
          const statusIcon =
            runtime.status === 'running' || runtime.status === 'ready'
              ? '$(vm-active)'
              : '$(vm-outline)';
          const creditsUsed = runtime.credits_used || 0;
          const creditsLimit = runtime.credits_limit || 10;

          const item: any = {
            label: `${statusIcon} ${runtime.given_name || runtime.pod_name || 'Runtime'}`,
            description: `${runtime.status} • ${creditsUsed}/${creditsLimit} credits`,
            detail: `Environment: ${runtime.environment_name || 'python-cpu-env'}`,
          };
          item.runtime = runtime;
          items.push(item);
        });

        // Add separator
        items.push({
          label: '',
          kind: vscode.QuickPickItemKind.Separator,
        } as vscode.QuickPickItem);
      }

      // Add create options
      const cpuItem: any = {
        label: '$(add) Create CPU Runtime',
        description: 'Python CPU Environment',
        detail: 'Create a new runtime with CPU resources',
      };
      cpuItem.action = 'create-cpu';
      items.push(cpuItem);

      const aiItem: any = {
        label: '$(add) Create AI Runtime',
        description: 'Python AI Environment',
        detail: 'Create a new runtime with GPU resources for AI/ML workloads',
      };
      aiItem.action = 'create-ai';
      items.push(aiItem);

      // Show quick pick
      const selected = await vscode.window.showQuickPick(items, {
        placeHolder:
          runtimes.length === 0
            ? 'No runtimes found. Create a new one?'
            : 'Select a runtime or create a new one',
        title: 'Select Datalayer Runtime',
      });

      if (!selected) {
        return;
      }

      // Handle selection
      const selectedAny = selected as any;
      if (selectedAny.runtime) {
        // Use existing runtime
        const runtime = selectedAny.runtime as RuntimeResponse;
        this.sendRuntimeToWebview(webview, runtime);
      } else if (selectedAny.action) {
        // Create new runtime
        const environment =
          selectedAny.action === 'create-ai' ? 'ai-env' : 'python-cpu-env';

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: 'Creating runtime...',
            cancellable: false,
          },
          async () => {
            const config =
              vscode.workspace.getConfiguration('datalayer.runtime');
            const creditsLimit = config.get<number>('creditsLimit', 10);

            const newRuntime = await runtimesApi.createRuntime(
              creditsLimit,
              'notebook',
              `VSCode ${selectedAny.action === 'create-ai' ? 'AI' : 'CPU'} Runtime`,
              environment,
            );

            if (newRuntime) {
              // Wait for runtime to be ready
              let retries = 0;
              const maxRetries = 10;
              while (retries < maxRetries && newRuntime.pod_name) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                const updatedRuntime = await runtimesApi.getRuntime(
                  newRuntime.pod_name,
                );
                if (updatedRuntime?.ingress && updatedRuntime?.token) {
                  this.sendRuntimeToWebview(webview, updatedRuntime);
                  vscode.window.showInformationMessage(
                    'Runtime created successfully',
                  );
                  return;
                }
                retries++;
              }

              // Use whatever we have if not fully ready
              this.sendRuntimeToWebview(webview, newRuntime);
              vscode.window.showWarningMessage(
                'Runtime created but may not be fully ready',
              );
            }
          },
        );
      }
    } catch (error) {
      console.error('[NotebookEditor] Error in runtime selection:', error);
      vscode.window.showErrorMessage(`Failed to select runtime: ${error}`);
    }
  }

  private async handleLocalNotebookRuntimeSelection(
    webview: vscode.WebviewPanel,
    message: ExtensionMessage,
  ) {
    // Show quick pick with options
    const items: vscode.QuickPickItem[] = [
      {
        label: '$(cloud) Datalayer Runtimes',
        description: 'Use a Datalayer cloud runtime',
        detail: 'Select from existing runtimes or create a new one',
      },
      {
        label: '$(server) Jupyter Server URL',
        description: 'Connect to a Jupyter server',
        detail: 'Enter the URL of a running Jupyter server',
      },
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select kernel source',
      title: 'Select Kernel',
    });

    if (!selected) {
      return;
    }

    if (selected.label.includes('Datalayer Runtimes')) {
      // Use the existing Datalayer runtime selection
      this.handleRuntimeSelection(webview, message);
    } else if (selected.label.includes('Jupyter Server URL')) {
      // Show input box for Jupyter server URL
      setRuntime()
        .then((baseURL: string | undefined) => {
          if (baseURL) {
            const parsedURL = new URL(baseURL);
            const token = parsedURL.searchParams.get('token') ?? '';
            parsedURL.search = '';
            const baseUrl = parsedURL.toString();

            this.postMessage(
              webview,
              'set-runtime',
              {
                baseUrl,
                token,
              },
              message.id,
            );
          }
        })
        .catch((reason: any) => {
          console.error('Failed to get a server URL:', reason);
        });
    }
  }

  private sendRuntimeToWebview(
    webview: vscode.WebviewPanel,
    runtime: RuntimeResponse,
  ) {
    this.postMessage(webview, 'runtime-selected', {
      runtime: {
        uid: runtime.uid,
        name: runtime.given_name || runtime.pod_name,
        status: runtime.status,
        url: runtime.ingress,
        token: runtime.token,
        environment: runtime.environment_name,
        creditsUsed: runtime.credits_used,
        creditsLimit: runtime.credits_limit,
      },
    });
  }

  private onMessage(
    webview: vscode.WebviewPanel,
    document: NotebookDocument,
    message: ExtensionMessage,
  ) {
    switch (message.type) {
      case 'ready':
        // Handle in resolveCustomEditor
        return;
      case 'select-runtime': {
        const isDatalayerNotebook = message.body?.isDatalayerNotebook;
        if (isDatalayerNotebook) {
          this.handleRuntimeSelection(webview, message);
        } else {
          // For local notebooks, show choice between Datalayer runtimes and Jupyter server
          this.handleLocalNotebookRuntimeSelection(webview, message);
        }
        return;
      }

      case 'http-request': {
        this._forwardRequest(message, webview);
        return;
      }

      case 'response': {
        const callback = this._callbacks.get(message.requestId!);
        if (callback) {
          callback(message.body);
          this._callbacks.delete(message.requestId!);
        } else {
          console.warn(
            '[NotebookEditor] No callback found for requestId:',
            message.requestId,
          );
        }
        return;
      }

      case 'websocket-open': {
        this._openWebsocket(message, webview);
        return;
      }

      case 'websocket-message': {
        console.log(
          `Sending websocket message from ${message.id}.`,
          message.body,
        );
        const { id } = message;
        const ws = this._websockets.get(id ?? '');
        if (!ws) {
          console.error(
            'Failed to send websocket message from editor with no matching websocket.',
            message,
          );
        }

        ws!.send(message.body.data);
        return;
      }

      case 'websocket-close': {
        const { id } = message;
        this._websockets.get(id ?? '')?.close();
        return;
      }

      case 'notebook-content-changed': {
        // Only track changes for local notebooks, not Datalayer space notebooks
        const isDatalayerNotebook = document.uri.scheme === 'datalayer';
        console.log('[NotebookEditor] notebook-content-changed received', {
          isDatalayerNotebook,
          scheme: document.uri.scheme,
          hasContent: !!message.body?.content,
          contentType: message.body?.content?.constructor?.name,
          contentLength: message.body?.content?.length,
        });

        if (!isDatalayerNotebook) {
          console.log(
            '[NotebookEditor] Processing content change for local notebook',
          );

          // Ensure content is a Uint8Array
          let content: Uint8Array;
          if (message.body.content instanceof Uint8Array) {
            content = message.body.content;
          } else if (Array.isArray(message.body.content)) {
            // Convert array to Uint8Array if needed
            content = new Uint8Array(message.body.content);
          } else {
            console.error(
              '[NotebookEditor] Invalid content type:',
              typeof message.body.content,
            );
            return;
          }

          console.log(
            '[NotebookEditor] Making edit with content size:',
            content.length,
          );
          document.makeEdit({
            type: 'content-update',
            content: content,
          });
          console.log(
            '[NotebookEditor] Edit made, document should be marked dirty',
          );
        } else {
          console.log(
            '[NotebookEditor] Skipping content change for Datalayer notebook',
          );
        }
        return;
      }

      // This case should not happen as getFileData is handled differently
      case 'getFileData': {
        console.warn('[NotebookEditor] Unexpected getFileData message');
        return;
      }
    }
    console.warn(`Unknown message ${message.type}.`, message);
  }

  private _forwardRequest(
    message: ExtensionMessage,
    webview: vscode.WebviewPanel,
  ) {
    const { body, id } = message;
    fetch(body.url, {
      body: body.body,
      headers: body.headers,
      method: body.method,
    }).then(async (reply: any) => {
      const headers: Record<string, string> = [...reply.headers].reduce(
        (agg, pair) => ({ ...agg, [pair[0]]: pair[1] }),
        {},
      );
      const rawBody =
        body.method !== 'DELETE' ? await reply.arrayBuffer() : undefined;
      this.postMessage(
        webview,
        'http-response',
        {
          headers,
          body: rawBody,
          status: reply.status,
          statusText: reply.statusText,
        },
        id,
      );
    });
  }

  private _openWebsocket(
    message: ExtensionMessage,
    webview: vscode.WebviewPanel,
  ) {
    const { body, id } = message;
    const wsURL = new URL(body.origin);
    if (wsURL.searchParams.has('token')) {
      wsURL.searchParams.set('token', 'xxxxx');
    }
    const protocol = body.protocol || undefined;
    console.debug(
      `Opening websocket to ${wsURL.toString()} with protocol '${protocol}'.`,
    );
    const ws = new WebSocket(body.origin, protocol);
    this._websockets.set(id!, ws);
    webview.onDidDispose(() => {
      this._websockets.delete(id!);
      ws.close();
    });
    ws.onopen = event => {
      console.log(`Websocket to ${body.origin} opened.`);
      this.postMessage(webview, 'websocket-open', {}, id);
    };
    ws.onmessage = event => {
      const { data } = event;
      console.debug(`Message on ${wsURL.toString()}:`, { data });
      this.postMessage(webview, 'websocket-message', { data }, id);
    };
    ws.onclose = event => {
      console.log(`Websocket to ${wsURL.toString()} closed.`);
      const { code, reason, wasClean } = event;
      this.postMessage(
        webview,
        'websocket-close',
        { code, reason, wasClean },
        id,
      );
    };
    ws.onerror = event => {
      console.debug(`Error on ${wsURL.toString()}:`, event);
      const { error, message } = event;
      this.postMessage(webview, 'websocket-error', { error, message }, id);
    };
  }
}

/**
 * Tracks all webviews.
 */
class WebviewCollection {
  private readonly _webviews = new Set<{
    readonly resource: string;
    readonly webviewPanel: vscode.WebviewPanel;
  }>();

  /**
   * Get all known webviews for a given uri.
   */
  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString();
    for (const entry of this._webviews) {
      if (entry.resource === key) {
        yield entry.webviewPanel;
      }
    }
  }

  /**
   * Add a new webview to the collection.
   */
  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel };
    this._webviews.add(entry);

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry);
    });
  }
}
