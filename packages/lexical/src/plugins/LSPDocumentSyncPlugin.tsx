/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LSP Document Sync Plugin for Lexical editor.
 * Synchronizes JupyterInputNode content with extension host for LSP analysis.
 * Sends document open/sync/close messages to keep temp files up to date.
 *
 * @module lexical/plugins/LSPDocumentSyncPlugin
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isElementNode, type LexicalNode } from 'lexical';

import {
  $isJupyterInputNode,
  type JupyterInputNode,
} from '../nodes/JupyterInputNode';
import type { CellLanguage } from './lspTypes';

/**
 * Detect cell language from JupyterInputNode
 */
function detectCellLanguage(node: JupyterInputNode): CellLanguage {
  const language = node.getLanguage();

  if (!language) {
    return 'python'; // Default to Python
  }

  // Map Prism language identifiers to LSP languages
  if (language === 'python' || language === 'py') {
    return 'python';
  } else if (
    language === 'markdown' ||
    language === 'md' ||
    language === 'text'
  ) {
    return 'markdown';
  }

  return 'unknown';
}

/**
 * Document event data
 */
export interface DocumentEventData {
  /** Cell/node UUID */
  cellId: string;

  /** Document/notebook ID */
  notebookId: string;

  /** Cell content */
  content: string;

  /** Cell language */
  language: CellLanguage;

  /** Content version timestamp */
  version: number;
}

/**
 * LSP Document Sync Plugin props
 */
export interface LSPDocumentSyncPluginProps {
  /** Lexical document ID */
  lexicalId: string;

  /** Callback when a new document should be opened */
  onDocumentOpen?: (data: DocumentEventData) => void;

  /** Callback when document content changes */
  onDocumentSync?: (data: DocumentEventData) => void;

  /** Callback when a document should be closed */
  onDocumentClose?: (cellId: string) => void;

  /** Disable the plugin */
  disabled?: boolean;
}

/**
 * LSP Document Sync Plugin.
 * Monitors editor state and sends sync messages to extension host.
 * Tracks JupyterInputNodes and sends open/sync/close messages for LSP analysis.
 */
export function LSPDocumentSyncPlugin({
  lexicalId,
  onDocumentOpen,
  onDocumentSync,
  onDocumentClose,
  disabled = false,
}: LSPDocumentSyncPluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Track known nodes to detect additions/removals
  const trackedNodesRef = useRef<Set<string>>(new Set());

  // Stable refs for callbacks to prevent useEffect from re-running
  const onDocumentOpenRef = useRef(onDocumentOpen);
  const onDocumentSyncRef = useRef(onDocumentSync);
  const onDocumentCloseRef = useRef(onDocumentClose);

  // Update refs when callbacks change
  useEffect(() => {
    onDocumentOpenRef.current = onDocumentOpen;
    onDocumentSyncRef.current = onDocumentSync;
    onDocumentCloseRef.current = onDocumentClose;
  }, [onDocumentOpen, onDocumentSync, onDocumentClose]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    // Shared function to scan and sync nodes
    const scanAndSyncNodes = () => {
      const root = $getRoot();

      // Find all JupyterInputNodes in the document
      const currentNodes = new Map<
        string,
        { uuid: string; content: string; language: CellLanguage }
      >();

      function traverse(node: LexicalNode) {
        if ($isJupyterInputNode(node)) {
          const uuid = node.getJupyterInputNodeUuid();
          const content = node.getTextContent();
          const language = detectCellLanguage(node);

          // Only track Python and Markdown cells
          if (language === 'python' || language === 'markdown') {
            currentNodes.set(uuid, { uuid, content, language });
          }
        }
        if ($isElementNode(node)) {
          node.getChildren().forEach(traverse);
        }
      }

      traverse(root);

      // Send document-open for new nodes
      for (const [uuid, nodeData] of currentNodes) {
        if (!trackedNodesRef.current.has(uuid)) {
          // New node - call onDocumentOpen callback
          onDocumentOpenRef.current?.({
            cellId: nodeData.uuid,
            notebookId: lexicalId,
            content: nodeData.content,
            language: nodeData.language,
            version: Date.now(),
          });
          trackedNodesRef.current.add(uuid);
        } else {
          // Existing node - call onDocumentSync callback
          onDocumentSyncRef.current?.({
            cellId: nodeData.uuid,
            notebookId: lexicalId,
            content: nodeData.content,
            language: nodeData.language,
            version: Date.now(),
          });
        }
      }

      // Send document-close for removed nodes
      // TEMPORARILY DISABLED - Debug why traverse fails to find nodes
      // const currentUuids = new Set(currentNodes.keys());
      // for (const trackedUuid of trackedNodesRef.current) {
      //   if (!currentUuids.has(trackedUuid)) {
      //     onDocumentCloseRef.current?.(trackedUuid);
      //     trackedNodesRef.current.delete(trackedUuid);
      //   }
      // }
    };

    // 🚀 PROACTIVE: Scan immediately on mount for fast completions!
    // Don't wait for first editor update - Pylance needs time to analyze
    editor.getEditorState().read(scanAndSyncNodes);

    // Register update listener to sync on subsequent changes
    const unregisterUpdateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        editorState.read(scanAndSyncNodes);
      },
    );

    return () => {
      // Clean up on unmount
      unregisterUpdateListener();

      // Send close callbacks for all tracked nodes
      // TEMPORARILY DISABLED - Testing if close messages are causing issues
      // for (const uuid of trackedNodesRef.current) {
      //   onDocumentCloseRef.current?.(uuid);
      // }

      trackedNodesRef.current.clear();
    };
  }, [editor, lexicalId, disabled]); // vscodeRef is stable, no need in deps

  return null;
}
