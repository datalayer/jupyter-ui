/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lexical plugin for LLM-powered inline code completions in Jupyter cells.
 * Displays ghost text suggestions that can be accepted (Tab) or dismissed (Escape).
 *
 * @module plugins/LexicalInlineCompletionPlugin
 *
 * @remarks
 * This plugin:
 * - Monitors editor updates and requests completions when text changes
 * - Only triggers for non-empty content (no completions on blank lines or cursor movement)
 * - Uses NodeTransform to persist InlineCompletionNode across JupyterInputOutputPlugin updates
 * - Restricts completions to the active JupyterInputNode only
 * - Debounces requests to avoid API spam (default 200ms)
 *
 * Key behaviors:
 * - Tab: Accepts completion and inserts as real text
 * - Escape: Dismisses completion
 * - Typing: Replaces current completion with new request
 * - Cursor movement: No new requests (text must change)
 *
 * @example
 * ```tsx
 * <LexicalComposer>
 *   <LexicalInlineCompletionPlugin
 *     providers={[myLLMProvider]}
 *     debounceMs={200}
 *     enabled={true}
 *   />
 * </LexicalComposer>
 * ```
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $getNodeByKey,
  $createTextNode,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  KEY_TAB_COMMAND,
  KEY_ESCAPE_COMMAND,
  type LexicalNode,
} from 'lexical';
import {
  $isJupyterInputNode,
  JupyterInputNode,
} from '../nodes/JupyterInputNode';
import { $isJupyterInputHighlightNode } from '../nodes/JupyterInputHighlightNode';
import {
  $createInlineCompletionNode,
  $isInlineCompletionNode,
} from '../nodes/InlineCompletionNode';

/**
 * Provider interface for LLM completion services.
 * Implement this to integrate your LLM backend.
 */
export interface IInlineCompletionProvider {
  /** Provider name for logging/debugging */
  readonly name: string;

  /**
   * Fetches completion suggestions from LLM.
   * @param request - Code text and cursor position
   * @param context - Code before and after cursor
   * @returns Promise with completion suggestions
   */
  fetch(
    request: CompletionRequest,
    context: CompletionContext,
  ): Promise<CompletionList>;
}

/**
 * Completion request sent to provider.
 */
export interface CompletionRequest {
  /** Full cell text */
  text: string;
  /** Cursor position in text */
  offset: number;
  /** Programming language (e.g., 'python') */
  language?: string;
}

/**
 * Context information for completion request.
 */
export interface CompletionContext {
  /** Text before cursor */
  before: string;
  /** Text after cursor */
  after: string;
}

/**
 * List of completion suggestions from provider.
 */
export interface CompletionList {
  /** Array of completion items */
  items: CompletionItem[];
}

/**
 * Single completion suggestion.
 */
export interface CompletionItem {
  /** Text to insert if accepted */
  insertText: string;
}

/**
 * Props for LexicalInlineCompletionPlugin.
 */
export interface LexicalInlineCompletionPluginProps {
  /** Array of completion providers (currently uses first one) */
  providers: IInlineCompletionProvider[];
  /** Debounce delay in milliseconds before requesting completion */
  debounceMs?: number;
  /** Whether completions are enabled */
  enabled?: boolean;
}

/**
 * Lexical plugin component for inline code completions.
 * Must be used within LexicalComposer context.
 *
 * @param props - Plugin configuration
 * @returns null - Plugin has no visual component
 */
export function LexicalInlineCompletionPlugin({
  providers,
  debounceMs = 200,
  enabled = true,
}: LexicalInlineCompletionPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const [currentCompletion, setCurrentCompletion] = useState<string | null>(
    null,
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>('');
  const lastCellTextRef = useRef<string>('');
  const completionNodeKeyRef = useRef<string | null>(null);
  const requestCompletionRef = useRef<typeof requestCompletion | null>(null);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    console.warn('[InlineCompletionPlugin] Mounted', {
      enabled,
      providers: providers.length,
    });
    return () => {
      console.warn('[InlineCompletionPlugin] Unmounted - cleaning up timer');
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []); // Only on mount/unmount

  /**
   * Request completion from providers
   */
  const requestCompletion = useCallback(
    async (cellText: string, cursorOffset: number, language: string) => {
      if (!providers || providers.length === 0) {
        console.warn('[InlineCompletionPlugin] ❌ No provider configured');
        return;
      }

      const provider = providers[0];

      try {
        console.warn('[InlineCompletionPlugin] 📡 Requesting completion:', {
          textLength: cellText.length,
          cursorOffset,
          language,
          before: cellText
            .substring(0, cursorOffset)
            .substring(Math.max(0, cursorOffset - 50)),
          after: cellText.substring(cursorOffset, cursorOffset + 50),
        });

        const before = cellText.substring(0, cursorOffset);
        const after = cellText.substring(cursorOffset);

        const result = await provider.fetch(
          { text: cellText, offset: cursorOffset, language },
          { before, after },
        );

        console.warn('[InlineCompletionPlugin] 📬 Received response:', {
          itemCount: result?.items?.length || 0,
          firstItem: result?.items?.[0]?.insertText?.substring(0, 100),
        });

        if (result && result.items && result.items.length > 0) {
          const completion = result.items[0].insertText;
          console.warn(
            '[InlineCompletionPlugin] ✅ Setting completion:',
            completion.substring(0, 100),
          );
          setCurrentCompletion(completion);
        } else {
          console.warn('[InlineCompletionPlugin] ⚠️ No completion items');
          setCurrentCompletion(null);
        }
      } catch (error) {
        console.error(
          '[InlineCompletionPlugin] ❌ Error requesting completion:',
          error,
        );
        setCurrentCompletion(null);
      }
    },
    [providers],
  );

  // Keep ref updated with latest requestCompletion
  useEffect(() => {
    requestCompletionRef.current = requestCompletion;
  }, [requestCompletion]);

  /**
   * Monitor editor updates and trigger completions
   */
  useEffect(() => {
    if (!enabled) return;

    console.warn('[InlineCompletionPlugin] 🎧 Registering update listener');

    return editor.registerUpdateListener(({ editorState }) => {
      console.warn('[InlineCompletionPlugin] 📝 Editor update fired');

      editorState.read(() => {
        const selection = $getSelection();
        console.warn('[InlineCompletionPlugin] Selection:', {
          type: selection?.constructor.name,
          isRange: $isRangeSelection(selection),
          isCollapsed: $isRangeSelection(selection)
            ? selection.isCollapsed()
            : false,
        });

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          console.warn('[InlineCompletionPlugin] ❌ Not collapsed selection');
          setCurrentCompletion(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();
        console.warn('[InlineCompletionPlugin] Anchor node:', {
          type: anchorNode.getType(),
          key: anchorNode.getKey(),
        });

        const jupyterInputNode = findJupyterInputParent(anchorNode);

        if (!jupyterInputNode) {
          console.warn('[InlineCompletionPlugin] ❌ Not in JupyterInputNode');
          setCurrentCompletion(null);
          return;
        }

        console.warn('[InlineCompletionPlugin] ✅ Inside JupyterInputNode');

        // Get cell text and cursor position
        const cellText = jupyterInputNode.getTextContent();
        const cursorOffset = getCursorOffset(jupyterInputNode, selection);

        // Check if cell text actually changed (not just cursor movement)
        if (cellText === lastCellTextRef.current) {
          console.warn(
            '[InlineCompletionPlugin] ⏭️ Cell text unchanged, skipping (cursor movement only)',
          );
          return;
        }

        // Update last cell text
        lastCellTextRef.current = cellText;

        console.warn('[InlineCompletionPlugin] Cell state:', {
          cellLength: cellText.length,
          cursorOffset,
          lastChars: cellText.substring(
            Math.max(0, cursorOffset - 20),
            cursorOffset,
          ),
        });

        // Check if there's ANY non-whitespace content before cursor
        // (either on current line or previous lines)
        const textBeforeCursor = cellText.substring(0, cursorOffset);

        if (textBeforeCursor.trim().length === 0) {
          console.warn(
            '[InlineCompletionPlugin] ❌ No content before cursor (empty or whitespace only)',
          );
          setCurrentCompletion(null);
          return;
        }

        // Also check if current line is empty (e.g., just pressed Enter)
        // Find start of current line
        const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        const currentLineBeforeCursor = textBeforeCursor.substring(lineStart);
        if (currentLineBeforeCursor.trim().length === 0) {
          console.warn(
            '[InlineCompletionPlugin] ❌ Current line is empty (no completion on blank lines)',
          );
          setCurrentCompletion(null);
          return;
        }

        // Only request at end of line (current line, not entire cell)
        const textAfterCursor = cellText.substring(cursorOffset);
        const nextNewline = textAfterCursor.indexOf('\n');

        // Get text after cursor on CURRENT LINE only (before next newline)
        const textAfterCursorOnLine =
          nextNewline === -1
            ? textAfterCursor
            : textAfterCursor.substring(0, nextNewline);

        console.warn('[InlineCompletionPlugin] After cursor:', {
          nextNewline,
          onCurrentLine: textAfterCursorOnLine,
          trimmedOnLineLength: textAfterCursorOnLine.trim().length,
        });

        // Check if there's text after cursor ON THE CURRENT LINE
        if (textAfterCursorOnLine.trim().length > 0) {
          let hasCompletionNode = false;
          const children = jupyterInputNode.getChildren();
          for (const child of children) {
            if ($isInlineCompletionNode(child)) {
              hasCompletionNode = true;
              break;
            }
          }

          console.warn('[InlineCompletionPlugin] Text after cursor check:', {
            textAfterLength: textAfterCursor.trim().length,
            hasCompletionNode,
            childrenCount: children.length,
          });

          if (!hasCompletionNode) {
            console.warn(
              '[InlineCompletionPlugin] ❌ Not at end of line (no completion node found)',
            );
            setCurrentCompletion(null);
            return;
          }
          // If we found our completion node, continue (don't clear it)
          console.warn(
            '[InlineCompletionPlugin] ✅ Has completion node, allowing',
          );
        }

        // Debounce requests
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        const requestKey = `${cellText}:${cursorOffset}`;

        if (cellText.trim().length < 2) {
          console.warn('[InlineCompletionPlugin] ❌ Text too short');
          setCurrentCompletion(null);
          lastRequestRef.current = '';
          return;
        }

        // Schedule timer even if same request (debounce behavior)
        console.warn(
          '[InlineCompletionPlugin] ⏰ Scheduling request in',
          debounceMs,
          'ms',
          requestKey === lastRequestRef.current
            ? '(same request)'
            : '(new request)',
        );

        debounceTimerRef.current = setTimeout(() => {
          console.warn('[InlineCompletionPlugin] 🚀 Firing completion request');

          // Only make actual request if different from last
          if (requestKey !== lastRequestRef.current) {
            lastRequestRef.current = requestKey;
            requestCompletionRef.current?.(cellText, cursorOffset, 'python');
          } else {
            console.warn(
              '[InlineCompletionPlugin] ⏭️ Same as last completed request, skipping API call',
            );
          }
        }, debounceMs);
      });
    });
  }, [editor, enabled, debounceMs]); // Removed requestCompletion dependency

  /**
   * Insert/update/remove the InlineCompletionNode based on currentCompletion
   */
  useEffect(() => {
    if (!enabled) return;

    console.warn(
      '[InlineCompletionPlugin] 🔧 Node management effect triggered:',
      {
        hasCompletion: !!currentCompletion,
        completionLength: currentCompletion?.length || 0,
        hasExistingNode: !!completionNodeKeyRef.current,
      },
    );

    editor.update(() => {
      const selection = $getSelection();
      console.warn('[InlineCompletionPlugin] Selection for insertion:', {
        type: selection?.constructor.name,
        isRange: $isRangeSelection(selection),
      });

      if (!$isRangeSelection(selection)) {
        console.warn(
          '[InlineCompletionPlugin] ❌ Cannot manage nodes - no range selection',
        );
        return;
      }

      // Remove existing completion node
      if (completionNodeKeyRef.current) {
        console.warn(
          '[InlineCompletionPlugin] 🗑️ Removing existing node:',
          completionNodeKeyRef.current,
        );
        const existingNode = $getNodeByKey(completionNodeKeyRef.current);
        if (existingNode && $isInlineCompletionNode(existingNode)) {
          existingNode.remove();
          console.warn('[InlineCompletionPlugin] ✅ Removed old node');
        } else {
          console.warn('[InlineCompletionPlugin] ⚠️ Old node not found');
        }
        completionNodeKeyRef.current = null;
      }

      // Insert new completion node if we have completion text
      if (currentCompletion && currentCompletion.trim().length > 0) {
        console.warn(
          '[InlineCompletionPlugin] 🎨 Inserting completion node:',
          currentCompletion.substring(0, 50),
        );
        const completionNode = $createInlineCompletionNode(currentCompletion);

        // Insert completion node at cursor position
        // Get anchor node and insert without breaking selection
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        console.warn('[InlineCompletionPlugin] 📌 Anchor:', {
          node: anchorNode.getType(),
          offset: anchorOffset,
        });

        // Handle different node types at cursor
        if (anchorNode.getType() === 'text') {
          const textNode = anchorNode as any; // TextNode

          // Split text at cursor: "hello|world" -> "hello" + completion + "world"
          const splitNodes = textNode.splitText(anchorOffset);
          const nodeAfterSplit = splitNodes[0];

          // Insert completion after the first part
          nodeAfterSplit.insertAfter(completionNode);

          console.warn('[InlineCompletionPlugin] ✅ Inserted after text split');
        } else if (anchorNode.getType() === 'jupyter-input-highlight') {
          // We're in a syntax highlight wrapper - insert after it
          console.warn(
            '[InlineCompletionPlugin] In highlight node, inserting after highlight wrapper',
          );
          anchorNode.insertAfter(completionNode);
        } else {
          // For any other node type, insert after it
          console.warn(
            '[InlineCompletionPlugin] Unknown node type, inserting after node',
          );
          anchorNode.insertAfter(completionNode);
        }

        completionNodeKeyRef.current = completionNode.getKey();

        console.warn(
          '[InlineCompletionPlugin] ✅ Inserted DecoratorNode with key:',
          completionNode.getKey(),
        );

        // Verify node persists in tree after insertion
        setTimeout(() => {
          editor.read(() => {
            const node = $getNodeByKey(completionNode.getKey());
            if (node) {
              console.warn(
                '[InlineCompletionPlugin] ✅ Node still in tree after 10ms',
              );
            } else {
              console.error(
                '[InlineCompletionPlugin] ❌ Node REMOVED from tree within 10ms!',
              );
            }
          });
        }, 10);

        setTimeout(() => {
          editor.read(() => {
            const node = $getNodeByKey(completionNode.getKey());
            if (node) {
              console.warn(
                '[InlineCompletionPlugin] ✅ Node still in tree after 100ms',
              );
            } else {
              console.error(
                '[InlineCompletionPlugin] ❌ Node REMOVED from tree within 100ms!',
              );
            }
          });
        }, 100);
      }
    });
  }, [editor, currentCompletion, enabled]);

  /**
   * Use NodeTransform to continuously re-add completion node after JupyterInputOutputPlugin updates
   * This ensures the completion persists even when JupyterInputNode is recreated
   */
  useEffect(() => {
    if (!enabled || !currentCompletion) return;

    console.warn(
      '[InlineCompletionPlugin] 🔄 Registering JupyterInputNode transform to maintain completion',
    );

    return editor.registerNodeTransform(
      JupyterInputNode,
      (node: JupyterInputNode) => {
        // Only add completion to the JupyterInputNode that contains the cursor
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const anchorNode = selection.anchor.getNode();
        const currentJupyterInputNode = findJupyterInputParent(anchorNode);

        // Only transform the node that currently has the cursor
        if (currentJupyterInputNode !== node) {
          return;
        }

        // Check if this JupyterInputNode should have a completion
        const children = node.getChildren();
        const hasCompletion = children.some((child: LexicalNode) =>
          $isInlineCompletionNode(child),
        );

        // If we have a completion to show but it's not in the tree, add it
        if (!hasCompletion && currentCompletion.trim()) {
          console.warn(
            '[InlineCompletionPlugin] 🔄 Transform: Re-adding completion to JupyterInputNode',
          );
          const completionNode = $createInlineCompletionNode(currentCompletion);

          // Insert at cursor position, not at end
          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          console.warn('[InlineCompletionPlugin] 🔄 Transform anchor:', {
            type: anchorNode.getType(),
            offset: anchorOffset,
          });

          // Use same insertion logic as initial insert
          if (anchorNode.getType() === 'text') {
            const textNode = anchorNode as any;
            const splitNodes = textNode.splitText(anchorOffset);
            const nodeAfterSplit = splitNodes[0];
            nodeAfterSplit.insertAfter(completionNode);
            console.warn(
              '[InlineCompletionPlugin] 🔄 Transform: Inserted after text split',
            );
          } else if (anchorNode.getType() === 'jupyter-input-highlight') {
            anchorNode.insertAfter(completionNode);
            console.warn(
              '[InlineCompletionPlugin] 🔄 Transform: Inserted after highlight node',
            );
          } else {
            anchorNode.insertAfter(completionNode);
            console.warn(
              '[InlineCompletionPlugin] 🔄 Transform: Inserted after unknown node',
            );
          }

          completionNodeKeyRef.current = completionNode.getKey();
        }
      },
    );
  }, [editor, currentCompletion, enabled]);

  /**
   * Handle Tab to accept completion
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent | null) => {
        if (!currentCompletion) return false;

        event?.preventDefault();

        editor.update(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          // Remove the completion node and insert as real text
          if (completionNodeKeyRef.current) {
            const completionNode = $getNodeByKey(completionNodeKeyRef.current);
            if (completionNode && $isInlineCompletionNode(completionNode)) {
              const textNode = $createTextNode(currentCompletion);
              completionNode.replace(textNode);
              completionNodeKeyRef.current = null;
            }
          }

          setCurrentCompletion(null);
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, enabled, currentCompletion]);

  /**
   * Handle Escape to dismiss
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      KEY_ESCAPE_COMMAND,
      () => {
        if (!currentCompletion) return false;
        setCurrentCompletion(null);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, enabled, currentCompletion]);

  return null;
}

/**
 * Find parent JupyterInputNode
 */
function findJupyterInputParent(node: LexicalNode): any | null {
  let current: LexicalNode | null = node;

  while (current) {
    if ($isJupyterInputNode(current)) {
      return current;
    }
    if ($isJupyterInputHighlightNode(current)) {
      const parent = current.getParent();
      if (parent && $isJupyterInputNode(parent)) {
        return parent;
      }
    }
    current = current.getParent();
  }
}

/**
 * Get accurate cursor offset using Lexical selection API
 */
function getCursorOffset(jupyterInputNode: any, selection: any): number {
  try {
    const firstDescendant = jupyterInputNode.getFirstDescendant();
    const startKey = firstDescendant
      ? firstDescendant.getKey()
      : jupyterInputNode.getKey();
    const startOffset = 0;
    const startType = firstDescendant
      ? ('text' as const)
      : ('element' as const);

    const tempSelection = selection.clone();
    tempSelection.anchor.set(startKey, startOffset, startType);
    tempSelection.focus.set(
      selection.anchor.key,
      selection.anchor.offset,
      selection.anchor.type,
    );

    return tempSelection.getTextContent().length;
  } catch (e) {
    console.error('[InlineCompletionPlugin] Error getting cursor offset:', e);
    return 0;
  }
}

export default LexicalInlineCompletionPlugin;
