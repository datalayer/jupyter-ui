/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import * as vscode from 'vscode';
import { WebSocket, RawData } from 'ws';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';
import { setRuntime } from './runtimePicker';
import type { ExtensionMessage } from './messages';

/**
 * Define the type of edits used in notebook files.
 */
interface NotebookEdit {
  readonly color: string;
  readonly stroke: ReadonlyArray<[number, number]>;
}

interface NotebookDocumentDelegate {
  getFileData(): Promise<Uint8Array>;
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

    this._onDidChange.fire({
      label: 'Stroke',
      undo: async () => {
        this._edits.pop();
        this._onDidChangeDocument.fire({
          edits: this._edits,
        });
      },
      redo: async () => {
        this._edits.push(edit);
        this._onDidChangeDocument.fire({
          edits: this._edits,
        });
      },
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
    const fileData = await this._delegate.getFileData();
    if (cancellation.isCancellationRequested) {
      return;
    }
    await vscode.workspace.fs.writeFile(targetResource, fileData);
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

  constructor(private readonly _context: vscode.ExtensionContext) {}

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
      document.onDidChange(e => {
        // Tell VS Code that the document has been edited by the user.
        this._onDidChangeCustomDocument.fire({
          document,
          ...e,
        });
      }),
    );

    listeners.push(
      document.onDidChangeContent(e => {
        // Update all webviews when the document changes
        for (const webviewPanel of this.webviews.get(document.uri)) {
          this.postMessage(webviewPanel, 'update', {
            edits: e.edits,
            content: e.content,
          });
        }
      }),
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

    // Wait for the webview to be properly ready before we init
    webviewPanel.webview.onDidReceiveMessage(e => {
      if (e.type === 'ready') {
        if (document.uri.scheme === 'untitled') {
          this.postMessage(webviewPanel, 'init', {
            untitled: true,
            editable: true,
          });
        } else {
          const editable = vscode.workspace.fs.isWritableFileSystem(
            document.uri.scheme,
          );

          this.postMessage(webviewPanel, 'init', {
            value: document.documentData,
            editable,
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
        setRuntime()
          .then(baseURL => {
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
          .catch(reason => {
            console.error('Failed to get a server URL.');
          });
        return;
      }

      case 'http-request': {
        this._forwardRequest(message, webview);
        return;
      }

      case 'response': {
        const callback = this._callbacks.get(message.id!);
        callback?.(message.body);
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
