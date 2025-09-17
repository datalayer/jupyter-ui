/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module lexicalEditor
 * @description Custom editor provider for Lexical document files (.lexical).
 * This module implements a webview-based Lexical editor with full rich text functionality,
 * including save/load operations, VS Code theme integration, and editor state management.
 */

import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';
import { DocumentBridge } from './spaces/documentBridge';

/**
 * Delegate interface for lexical document operations.
 * Provides methods for retrieving document data from the webview.
 *
 * @interface LexicalDocumentDelegate
 */
interface LexicalDocumentDelegate {
  /**
   * Retrieves the current file data from the webview.
   * @returns {Promise<Uint8Array>} The lexical file content as a byte array
   */
  getFileData(): Promise<Uint8Array>;
}

/**
 * Represents a lexical document in the editor.
 * Manages the document's lifecycle, content, and edit history.
 *
 * @class LexicalDocument
 * @extends {Disposable}
 * @implements {vscode.CustomDocument}
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
    console.log('[LexicalDocument] Reading file:', uri.toString());
    return new Uint8Array(await vscode.workspace.fs.readFile(uri));
  }

  private readonly _uri: vscode.Uri;
  private _documentData: Uint8Array;
  private _isDirty: boolean = false;
  private readonly _delegate: LexicalDocumentDelegate;

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
    return this._isDirty;
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
    this._isDirty = true;
    this._onDidChange.fire();
  }

  async save(cancellation: vscode.CancellationToken): Promise<void> {
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
 * Handles the creation, management, and lifecycle of Lexical editor webviews.
 *
 * @class LexicalEditorProvider
 * @implements {vscode.CustomEditorProvider<LexicalDocument>}
 */
export class LexicalEditorProvider
  implements vscode.CustomEditorProvider<LexicalDocument>
{
  /**
   * Registers the Lexical editor provider with VS Code.
   * Sets up the custom editor and the command to create new Lexical documents.
   *
   * @static
   * @param {vscode.ExtensionContext} context - The extension context
   * @returns {vscode.Disposable} Disposable for cleanup
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
   * Used to track and manage multiple editor instances.
   *
   * @private
   * @readonly
   */
  private readonly webviews = new Map<
    string,
    {
      readonly resource: string;
      readonly webviewPanel: vscode.WebviewPanel;
    }
  >();

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

    webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));

    // Send initial content immediately after setting HTML
    setTimeout(() => {
      console.log('[Lexical] Sending initial content to webview');

      // Check if this file is from Datalayer spaces
      const isFromDatalayer = document.uri.scheme === 'datalayer';

      console.log(
        '[Lexical] File from Datalayer:',
        isFromDatalayer,
        'URI:',
        document.uri.toString(),
      );

      webviewPanel.webview.postMessage({
        type: 'update',
        content: Array.from(document.documentData),
        editable: !isFromDatalayer, // Read-only for Datalayer files
      });
    }, 100);
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
   * Includes all necessary scripts, styles, and VS Code theme integration.
   *
   * @private
   * @param {vscode.Webview} webview - The webview to generate HTML for
   * @returns {string} Complete HTML document for the Lexical editor
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
    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri}" rel="stylesheet">
        <title>Datalayer Lexical Editor</title>
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
        // Content changed in the editor, only mark as dirty if not from Datalayer
        if (!isFromDatalayer) {
          document.makeEdit(message);
        }
        return;
      }
      case 'save': {
        // Explicit save from the editor (Cmd/Ctrl+S)
        // Only allow saving if not from Datalayer (read-only)
        if (!isFromDatalayer) {
          vscode.commands.executeCommand('workbench.action.files.save');
        }
        return;
      }
      case 'ready': {
        // Editor is ready - initial content is already sent by resolveCustomEditor
        console.log('[Lexical] Webview ready, content already sent');
        return;
      }
    }
  }
}
