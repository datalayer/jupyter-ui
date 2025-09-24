/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module lexicalEditor
 * Custom editor provider for Lexical document files (.lexical).
 *
 * This module provides:
 * - Rich text editing with Lexical framework
 * - Collaboration support for Datalayer Spaces documents
 * - VS Code theme integration
 * - Virtual file system support for remote documents
 *
 * @packageDocumentation
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import { Disposable, disposeAll } from '../dispose';
import { getNonce } from '../util';
import { DocumentBridge } from '../spaces/documentBridge';
import { AuthService } from '../auth/authService';
import { SpacerApiService } from '../spaces/spacerApiService';

/**
 * Delegate interface for lexical document operations.
 *
 * @interface LexicalDocumentDelegate
 * @hidden
 */
interface LexicalDocumentDelegate {
  /**
   * Retrieves the current file data from the webview.
   *
   * @returns {Promise<Uint8Array>} The lexical file content as a byte array
   */
  getFileData(): Promise<Uint8Array>;
}

/**
 * Represents a lexical document in the editor.
 *
 * Manages document lifecycle, content state, and collaboration mode.
 * Handles both local and remote (Datalayer) documents.
 *
 * @hidden
 */
class LexicalDocument extends Disposable implements vscode.CustomDocument {
  static async create(
    uri: vscode.Uri,
    backupId: string | undefined,
    delegate: LexicalDocumentDelegate,
  ): Promise<LexicalDocument | PromiseLike<LexicalDocument>> {
    // If we have a backup, read that. Otherwise read the resource from the workspace
    const dataFile =
      typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
    const fileData = await LexicalDocument.readFile(dataFile);
    return new LexicalDocument(uri, fileData, delegate);
  }

  private static async readFile(uri: vscode.Uri): Promise<Uint8Array> {
    if (uri.scheme === 'untitled') {
      // Return default Lexical state for new documents
      const defaultState = {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Welcome to Datalayer Lexical Editor!',
                  type: 'text',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'paragraph',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1,
        },
      };
      return new TextEncoder().encode(JSON.stringify(defaultState));
    }

    // For Datalayer documents, the file should already be downloaded
    // and the virtual mapping should exist
    if (uri.scheme === 'datalayer') {
      // Try to get the document metadata from DocumentBridge
      const documentBridge = DocumentBridge.getInstance();
      const metadata = documentBridge.getDocumentMetadata(uri);

      if (metadata && metadata.localPath) {
        // Read directly from the local path
        if (fs.existsSync(metadata.localPath)) {
          const fileContent = fs.readFileSync(metadata.localPath);
          console.log(
            '[LexicalDocument] Reading file from:',
            metadata.localPath,
          );
          console.log('[LexicalDocument] File size:', fileContent.length);
          console.log(
            '[LexicalDocument] File content preview:',
            fileContent.toString('utf8').substring(0, 500),
          );
          return new Uint8Array(fileContent);
        }
      }

      // Fallback to trying the virtual file system
      try {
        return new Uint8Array(await vscode.workspace.fs.readFile(uri));
      } catch (error) {
        console.error(
          '[LexicalDocument] Failed to read Datalayer file:',
          error,
        );
        // Return empty default state if file can't be read
        return new TextEncoder().encode(
          JSON.stringify({
            root: {
              children: [],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'root',
              version: 1,
            },
          }),
        );
      }
    }

    return new Uint8Array(await vscode.workspace.fs.readFile(uri));
  }

  private readonly _uri: vscode.Uri;
  private _documentData: Uint8Array;
  private _isDirty: boolean = false;
  private readonly _delegate: LexicalDocumentDelegate;
  private _isCollaborative: boolean = false;

  private constructor(
    uri: vscode.Uri,
    initialContent: Uint8Array,
    delegate: LexicalDocumentDelegate,
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

  public get isDirty(): boolean {
    // Collaborative documents are never dirty as changes are saved automatically
    return this._isCollaborative ? false : this._isDirty;
  }

  public setCollaborative(isCollaborative: boolean): void {
    this._isCollaborative = isCollaborative;
    if (isCollaborative) {
      // Clear dirty state when entering collaborative mode
      this._isDirty = false;
    }
  }

  private readonly _onDidDispose = this._register(
    new vscode.EventEmitter<void>(),
  );
  public readonly onDidDispose = this._onDidDispose.event;

  private readonly _onDidChangeDocument = this._register(
    new vscode.EventEmitter<{
      readonly content?: Uint8Array;
    }>(),
  );
  public readonly onDidChangeContent = this._onDidChangeDocument.event;

  private readonly _onDidChange = this._register(
    new vscode.EventEmitter<void>(),
  );
  public readonly onDidChange = this._onDidChange.event;

  makeEdit(edit: any) {
    // Only mark as dirty if not in collaborative mode
    // Collaborative documents save automatically through WebSocket
    if (!this._isCollaborative) {
      this._isDirty = true;
    }
    this._onDidChange.fire();
  }

  async save(cancellation: vscode.CancellationToken): Promise<void> {
    // Skip saving for collaborative documents as they save automatically
    if (this._isCollaborative) {
      // Collaborative documents auto-save through WebSocket
      return;
    }

    const fileData = await this._delegate.getFileData();
    if (cancellation.isCancellationRequested) {
      return;
    }
    await vscode.workspace.fs.writeFile(this.uri, fileData);
    this._documentData = fileData;
    this._isDirty = false;
  }

  async saveAs(
    targetResource: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Promise<void> {
    const fileData = await this._delegate.getFileData();
    if (cancellation.isCancellationRequested) {
      return;
    }
    await vscode.workspace.fs.writeFile(targetResource, fileData);
  }

  async revert(_cancellation: vscode.CancellationToken): Promise<void> {
    const diskContent = await LexicalDocument.readFile(this.uri);
    this._documentData = diskContent;
    this._isDirty = false;
    this._onDidChangeDocument.fire({
      content: diskContent,
    });
  }

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

  dispose(): void {
    this._onDidDispose.fire();
    super.dispose();
  }
}

/**
 * Provider for Lexical document custom editors.
 *
 * Handles:
 * - Webview lifecycle management
 * - Document state synchronization
 * - Collaboration setup for Datalayer documents
 * - VS Code integration (save, undo, etc.)
 *
 * @class LexicalEditorProvider
 * @public
 */
export class LexicalEditorProvider
  implements vscode.CustomEditorProvider<LexicalDocument>
{
  /**
   * Registers the Lexical editor provider with VS Code.
   *
   * Sets up:
   * - Custom editor provider for .lexical files
   * - Command to create new Lexical documents
   * - Webview options for optimal performance
   *
   * @param {vscode.ExtensionContext} context - The VS Code extension context
   * @returns {vscode.Disposable} Registration disposable for cleanup
   * @public
   */
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    vscode.commands.registerCommand('datalayer.lexical-editor-new', () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage(
          'Creating new Datalayer Lexical documents currently requires opening a workspace',
        );
        return;
      }

      const uri = vscode.Uri.joinPath(
        workspaceFolders[0].uri,
        `new-${Date.now()}.lexical`,
      ).with({ scheme: 'untitled' });

      vscode.commands.executeCommand(
        'vscode.openWith',
        uri,
        LexicalEditorProvider.viewType,
      );
    });

    return vscode.window.registerCustomEditorProvider(
      LexicalEditorProvider.viewType,
      new LexicalEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    );
  }

  private static readonly viewType = 'datalayer.lexical-editor';

  /**
   * Map of currently active webviews keyed by document URI.
   * @private
   */
  private readonly webviews = new Map<
    string,
    {
      readonly resource: string;
      readonly webviewPanel: vscode.WebviewPanel;
    }
  >();

  /**
   * Creates a new LexicalEditorProvider.
   * @param _context - The VS Code extension context
   */
  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri,
    openContext: { backupId?: string },
    _token: vscode.CancellationToken,
  ): Promise<LexicalDocument> {
    const document: LexicalDocument = await LexicalDocument.create(
      uri,
      openContext.backupId,
      {
        getFileData: async () => {
          const webviewsForDocument = Array.from(this.webviews.values()).filter(
            entry => entry.resource === uri.toString(),
          );
          if (webviewsForDocument.length !== 1) {
            throw new Error('Expected exactly one webview for document');
          }
          const panel = webviewsForDocument[0].webviewPanel;
          const response = await this.postMessageWithResponse<
            number[] | undefined
          >(panel, 'getFileData', {});
          return new Uint8Array(response ?? []);
        },
      },
    );

    const listeners: vscode.Disposable[] = [];

    listeners.push(
      document.onDidChange(e => {
        // Fire content change event
        this._onDidChangeCustomDocument.fire({
          document,
          undo: () => {},
          redo: () => {},
        });
      }),
    );

    listeners.push(
      document.onDidChangeContent(e => {
        for (const webviewData of this.webviews.values()) {
          if (webviewData.resource === uri.toString()) {
            this.postMessage(webviewData.webviewPanel, 'update', {
              content: e.content,
            });
          }
        }
      }),
    );

    document.onDidDispose(() => disposeAll(listeners));

    return document;
  }

  async resolveCustomEditor(
    document: LexicalDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken,
  ): Promise<void> {
    this.webviews.set(document.uri.toString(), {
      resource: document.uri.toString(),
      webviewPanel,
    });

    webviewPanel.webview.options = {
      enableScripts: true,
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Store a flag to track when webview is ready
    let webviewReady = false;

    webviewPanel.webview.onDidReceiveMessage(e => {
      if (e.type === 'ready' && !webviewReady) {
        webviewReady = true;
        // Send content when webview signals it's ready
        sendInitialContent();
      } else {
        this.onMessage(document, e);
      }
    });

    // Cleanup when panel is disposed
    webviewPanel.onDidDispose(() => {
      this.webviews.delete(document.uri.toString());
    });

    // Function to send initial content
    const sendInitialContent = async () => {
      // Check if this file is from Datalayer spaces
      const isFromDatalayer = document.uri.scheme === 'datalayer';

      // Set collaborative mode for Datalayer documents
      if (isFromDatalayer) {
        document.setCollaborative(true);
      }

      // Send full content even for collaborative documents
      // The LoroCollaborativePlugin needs initial content to establish baseline
      const contentArray = Array.from(document.documentData);

      console.log('[LexicalEditor] Sending initial content to webview');
      console.log('[LexicalEditor] Content length:', contentArray.length);
      console.log(
        '[LexicalEditor] Content as string:',
        new TextDecoder()
          .decode(new Uint8Array(contentArray))
          .substring(0, 500),
      );

      // Prepare collaboration configuration if this is a Datalayer document
      let collaborationConfig = undefined;
      if (isFromDatalayer) {
        try {
          const authService = AuthService.getInstance();
          const authState = authService.getAuthState();

          if (authState.isAuthenticated && authState.token) {
            // Get document metadata from DocumentBridge
            const documentBridge = DocumentBridge.getInstance();
            const metadata = documentBridge.getDocumentMetadata(document.uri);

            if (metadata && metadata.document) {
              const apiService = SpacerApiService.getInstance();

              // Get collaboration session ID for lexical documents
              const sessionResult =
                await apiService.getLexicalCollaborationSessionId(
                  metadata.document.uid,
                );

              if (sessionResult.success && sessionResult.sessionId) {
                // Get user information for collaboration
                const user = authState.user as any;
                const username = user?.githubLogin
                  ? `@${user.githubLogin}`
                  : user?.name || user?.email || 'Anonymous';

                // Get spacerWsUrl configuration
                const config = vscode.workspace.getConfiguration('datalayer');
                const spacerWsUrl = config.get<string>(
                  'spacerWsUrl',
                  'wss://prod1.datalayer.run',
                );

                // Construct WebSocket URL for collaboration
                const websocketUrl = `${spacerWsUrl}/api/spacer/v1/lexical/ws/${sessionResult.sessionId}?token=${authState.token}`;

                // Simple collaboration config for the webview with direct WebSocket URL
                collaborationConfig = {
                  enabled: true,
                  websocketUrl,
                  documentId: metadata.document.uid,
                  sessionId: sessionResult.sessionId,
                  username,
                  userColor:
                    '#' + Math.floor(Math.random() * 16777215).toString(16), // Random color
                };
              }
            }
          }
        } catch (error) {
          console.error('[Lexical] Failed to setup collaboration:', error);
        }
      }

      webviewPanel.webview.postMessage({
        type: 'update',
        content: contentArray,
        editable: true,
        collaboration: collaborationConfig,
      });
    };
  }

  private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<
    vscode.CustomDocumentEditEvent<LexicalDocument>
  >();
  public readonly onDidChangeCustomDocument =
    this._onDidChangeCustomDocument.event;

  public saveCustomDocument(
    document: LexicalDocument,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.save(cancellation);
  }

  public saveCustomDocumentAs(
    document: LexicalDocument,
    destination: vscode.Uri,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.saveAs(destination, cancellation);
  }

  public revertCustomDocument(
    document: LexicalDocument,
    cancellation: vscode.CancellationToken,
  ): Thenable<void> {
    return document.revert(cancellation);
  }

  public backupCustomDocument(
    document: LexicalDocument,
    context: vscode.CustomDocumentBackupContext,
    cancellation: vscode.CancellationToken,
  ): Thenable<vscode.CustomDocumentBackup> {
    return document.backup(context.destination, cancellation);
  }

  /**
   * Generates the HTML content for the Lexical editor webview.
   *
   * @private
   * @param {vscode.Webview} webview - The webview to generate HTML for
   * @returns {string} Complete HTML document with scripts and styles
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        'dist',
        'lexicalWebview.js',
      ),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._context.extensionUri,
        'webview',
        'LexicalEditor.css',
      ),
    );
    // Get base URI for loading additional resources like WASM
    const distUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist'),
    );
    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <base href="${distUri}/">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'wasm-unsafe-eval' 'unsafe-eval'; connect-src ${webview.cspSource} https: wss: ws: data:; worker-src ${webview.cspSource} blob:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Datalayer Lexical Editor</title>
        <script nonce="${nonce}">
          // Set webpack public path for dynamic imports and WASM loading
          window.__webpack_public_path__ = '${distUri}/';
        </script>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  private _requestId = 1;
  private readonly _callbacks = new Map<number, (response: any) => void>();

  private postMessageWithResponse<R = unknown>(
    panel: vscode.WebviewPanel,
    type: string,
    body: any,
  ): Promise<R> {
    const requestId = this._requestId++;
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
  ): void {
    panel.webview.postMessage({ type, body });
  }

  private onMessage(document: LexicalDocument, message: any) {
    // Check if this document is from Datalayer spaces
    const isFromDatalayer = document.uri.scheme === 'datalayer';

    switch (message.type) {
      case 'response': {
        const callback = this._callbacks.get(message.requestId);
        callback?.(message.body);
        return;
      }
      case 'contentChanged': {
        // Mark as dirty only for local files (not Datalayer)
        if (!isFromDatalayer) {
          document.makeEdit(message);
        }
        return;
      }
      case 'save': {
        // Handle save command (Cmd/Ctrl+S)
        if (!isFromDatalayer) {
          vscode.commands.executeCommand('workbench.action.files.save');
        }
        return;
      }
      case 'ready': {
        // Handled in the message listener above
        return;
      }
    }
  }
}
