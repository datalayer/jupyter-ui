/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LSP Tab completion provider for Lexical editor.
 * Communicates with extension host to fetch LSP completions from Pylance and Markdown language servers.
 *
 * @module lexical/plugins/LSPTabCompletionProvider
 */

import type {
  ILSPCompletionProvider,
  LSPCompletionItem,
  CellLanguage,
  LSPCompletionRequestMessage,
  LSPMessage,
} from './lspTypes';

/**
 * LSP Tab completion provider for Lexical code blocks.
 * Fetches completions from extension host via postMessage.
 * Supports Python (via Pylance) and Markdown (via built-in VS Code markdown LSP).
 */
export class LexicalLSPCompletionProvider implements ILSPCompletionProvider {
  /** Human-readable provider name */
  readonly name = 'LSP (Python & Markdown)';

  /** Map of pending requests (requestId -> resolve function) */
  private pendingRequests = new Map<
    string,
    (items: LSPCompletionItem[]) => void
  >();

  /** Request counter for generating unique IDs */
  private requestCounter = 0;

  /** Lexical document ID for context */
  private lexicalId: string;

  /** VS Code API for postMessage communication */
  private vscodeAPI: any;

  /** Bound message handler for proper cleanup */
  private boundHandleMessage: (event: MessageEvent) => void;

  constructor(lexicalId: string, vscodeAPI?: any) {
    this.lexicalId = lexicalId;

    // Use provided VS Code API or global one
    this.vscodeAPI =
      vscodeAPI || (typeof window !== 'undefined' && (window as any).vscode);

    if (!this.vscodeAPI) {
      console.warn(
        '[LSP-Lexical] VS Code API not available, LSP completions disabled',
      );
    }

    // Bind message handler once for proper cleanup
    this.boundHandleMessage = this.handleMessage.bind(this);

    // Listen for LSP responses from extension host
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.boundHandleMessage);
    }
  }

  /**
   * Fetch completions for a code block at a specific position.
   *
   * @param nodeUuid - JupyterInputNode UUID
   * @param content - Full code block content
   * @param position - Cursor position (line/character)
   * @param language - Cell language ('python' | 'markdown')
   * @returns Promise resolving to completion items
   */
  async fetchCompletions(
    nodeUuid: string,
    content: string,
    position: { line: number; character: number },
    language: CellLanguage,
  ): Promise<LSPCompletionItem[]> {
    // Validate VS Code API
    if (!this.vscodeAPI) {
      console.error('[LSP-Lexical-Provider] VS Code API not available');
      return [];
    }

    // Only fetch completions for supported languages
    if (language !== 'python' && language !== 'markdown') {
      return [];
    }

    const requestId = `lsp-lexical-${++this.requestCounter}`;

    // Send request to extension host
    const message: LSPCompletionRequestMessage = {
      type: 'lsp-completion-request',
      requestId,
      cellId: nodeUuid,
      language,
      position,
      source: 'lexical',
      lexicalId: this.lexicalId,
    };

    // Wait for response with timeout
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.warn('[LSP-Lexical-Provider] Request timed out:', requestId);
        this.pendingRequests.delete(requestId);
        resolve([]);
      }, 15000); // 15 second timeout (Pylance needs time to analyze files)

      // CRITICAL: Register resolver BEFORE sending message to avoid race condition
      this.pendingRequests.set(
        requestId,
        (completions: LSPCompletionItem[]) => {
          clearTimeout(timeout);
          resolve(completions);
        },
      );

      this.vscodeAPI.postMessage(message);
    });
  }

  /**
   * Handle messages from extension host.
   */
  private handleMessage(event: MessageEvent): void {
    const message: LSPMessage = event.data;

    if (message.type === 'lsp-completion-response') {
      const resolver = this.pendingRequests.get(message.requestId);
      if (resolver) {
        resolver(message.completions || []);
        this.pendingRequests.delete(message.requestId);
      } else {
        console.warn(
          '[LSP-Lexical-Provider] No resolver found for requestId:',
          message.requestId,
        );
      }
    } else if (message.type === 'lsp-error') {
      console.error('[LSP-Lexical-Provider] LSP error received', message);
      const resolver = this.pendingRequests.get(message.requestId);
      if (resolver) {
        resolver([]); // Return empty on error
        this.pendingRequests.delete(message.requestId);
      }
    }
  }

  /**
   * Dispose of the provider and clean up resources.
   */
  dispose(): void {
    this.pendingRequests.clear();
    if (typeof window !== 'undefined' && this.boundHandleMessage) {
      window.removeEventListener('message', this.boundHandleMessage);
    }
  }
}
