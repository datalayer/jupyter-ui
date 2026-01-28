/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LSP completion types for Lexical editor integration.
 * @module lexical/plugins/lspTypes
 */

/**
 * Cell language type supported by LSP
 */
export type CellLanguage = 'python' | 'markdown' | 'unknown';

/**
 * VS Code CompletionItemKind enum values
 * https://code.visualstudio.com/api/references/vscode-api#CompletionItemKind
 */
export enum LSPCompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24,
}

/**
 * LSP completion item returned from extension host
 */
export interface LSPCompletionItem {
  /** Display label for the completion */
  label: string;

  /** Completion kind (method, function, variable, etc.) */
  kind?: LSPCompletionItemKind;

  /** Additional details about the completion */
  detail?: string;

  /** Documentation string or markdown */
  documentation?: string;

  /** Text to insert when selected */
  insertText: string;

  /** Text used for sorting completions */
  sortText?: string;

  /** Text used for filtering completions */
  filterText?: string;

  /** Range to replace in the document */
  range?: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

/**
 * Provider interface for fetching LSP completions
 */
export interface ILSPCompletionProvider {
  /** Human-readable provider name */
  readonly name: string;

  /**
   * Fetch completions for a code block at a specific position.
   * @param nodeUuid - JupyterInputNode UUID
   * @param content - Full code block content
   * @param position - Cursor position (line/character)
   * @param language - Cell language ('python' | 'markdown')
   * @returns Promise resolving to completion items
   */
  fetchCompletions(
    nodeUuid: string,
    content: string,
    position: { line: number; character: number },
    language: CellLanguage,
  ): Promise<LSPCompletionItem[]>;

  /** Dispose of the provider and clean up resources */
  dispose(): void;
}

/**
 * Message types for LSP communication with extension host
 */
export type LSPMessage =
  | LSPCompletionRequestMessage
  | LSPCompletionResponseMessage
  | LSPDocumentSyncMessage
  | LSPDocumentOpenMessage
  | LSPDocumentCloseMessage
  | LSPErrorMessage;

export interface LSPCompletionRequestMessage {
  type: 'lsp-completion-request';
  requestId: string;
  cellId: string;
  language: CellLanguage;
  position: { line: number; character: number };
  trigger?: string;
  source?: 'lexical';
  lexicalId?: string;
}

export interface LSPCompletionResponseMessage {
  type: 'lsp-completion-response';
  requestId: string;
  completions: LSPCompletionItem[];
}

export interface LSPDocumentSyncMessage {
  type: 'lsp-document-sync';
  cellId: string;
  content: string;
  version: number;
  source?: 'lexical';
  lexicalId?: string;
}

export interface LSPDocumentOpenMessage {
  type: 'lsp-document-open';
  cellId: string;
  notebookId: string;
  content: string;
  language: CellLanguage;
  source?: 'lexical';
}

export interface LSPDocumentCloseMessage {
  type: 'lsp-document-close';
  cellId: string;
  source?: 'lexical';
}

export interface LSPErrorMessage {
  type: 'lsp-error';
  requestId: string;
  error: string;
}
