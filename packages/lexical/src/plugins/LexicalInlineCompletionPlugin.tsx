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
  createCommand,
  type LexicalNode,
  type LexicalCommand,
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
import {
  mergeConfig,
  type PartialInlineCompletionConfig,
  type InlineCompletionConfig,
} from './InlineCompletionConfig';
import { extractContext } from './InlineCompletionContextExtractor';
import {
  LSP_MENU_STATE_COMMAND,
  LSP_COMPLETION_INSERTED_COMMAND,
} from './LSPTabCompletionPlugin';

/**
 * Command to manually trigger inline completion.
 * Dispatched by keyboard shortcut (e.g., Ctrl+Space).
 */
export const TRIGGER_INLINE_COMPLETION_COMMAND: LexicalCommand<void> =
  createCommand('TRIGGER_INLINE_COMPLETION_COMMAND');

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
  /** Content type: 'code' for Jupyter cells, 'prose' for natural language */
  contentType?: 'code' | 'prose';
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
  /**
   * Debounce delay in milliseconds before requesting completion.
   * @deprecated Use config.debounceMs instead
   */
  debounceMs?: number;
  /** Whether completions are enabled */
  enabled?: boolean;
  /**
   * Configuration for inline completions.
   * Supports both code and prose content types with flexible triggering.
   */
  config?: PartialInlineCompletionConfig;
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
  debounceMs: deprecatedDebounceMs,
  enabled = true,
  config: userConfig,
}: LexicalInlineCompletionPluginProps): null {
  const [editor] = useLexicalComposerContext();
  const [currentCompletion, setCurrentCompletion] = useState<string | null>(
    null,
  );
  const [lspMenuOpen, setLspMenuOpen] = useState<boolean>(false);

  // Merge user config with defaults
  const config: InlineCompletionConfig = mergeConfig(userConfig);

  // Debounce precedence: userConfig (new) > deprecatedDebounceMs (old) > default
  // Note: Using ?? operator, so 0 values will fall through (not a realistic use case)
  // INCREASED DEFAULT: 500ms instead of 200ms for better typing experience
  const debounceMs =
    userConfig?.debounceMs ??
    deprecatedDebounceMs ??
    Math.max(config.debounceMs, 500);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestRef = useRef<string>('');
  const lastCellTextRef = useRef<string>('');
  const completionNodeKeyRef = useRef<string | null>(null);
  const requestCompletionRef = useRef<typeof requestCompletion | null>(null);
  const lspInsertionTimeRef = useRef<number>(0); // Timestamp of last LSP completion insertion

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []); // Only on mount/unmount

  /**
   * Listen for LSP menu state changes.
   * When LSP dropdown opens, cancel pending inline completions and clear current completion.
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      LSP_MENU_STATE_COMMAND,
      (isOpen: boolean) => {
        setLspMenuOpen(isOpen);

        if (isOpen) {
          // LSP menu opened - cancel pending inline completion request
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }
          // Clear any visible inline completion
          setCurrentCompletion(null);
        }

        return false; // Don't prevent other listeners
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, enabled]);

  /**
   * Listen for LSP completion insertion.
   * When LSP completion is inserted, suppress inline completions briefly.
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      LSP_COMPLETION_INSERTED_COMMAND,
      () => {
        // Record timestamp of LSP insertion
        lspInsertionTimeRef.current = Date.now();

        // Clear any visible inline completion
        setCurrentCompletion(null);

        return false; // Don't prevent other listeners
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, enabled]);

  /**
   * Request completion from providers
   */
  const requestCompletion = useCallback(
    async (
      cellText: string,
      cursorOffset: number,
      language: string,
      contentType: 'code' | 'prose' = 'code',
    ) => {
      if (!providers || providers.length === 0) {
        return;
      }

      const provider = providers[0];

      try {
        const before = cellText.substring(0, cursorOffset);
        const after = cellText.substring(cursorOffset);

        const result = await provider.fetch(
          { text: cellText, offset: cursorOffset, language, contentType },
          { before, after },
        );

        if (result && result.items && result.items.length > 0) {
          const completion = result.items[0].insertText;
          setCurrentCompletion(completion);
        } else {
          setCurrentCompletion(null);
        }
      } catch (error) {
        console.error(
          '[InlineCompletionPlugin] Error requesting completion:',
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

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        // Don't request inline completions if LSP dropdown menu is active
        if (lspMenuOpen) {
          setCurrentCompletion(null);
          return;
        }

        // Suppress inline completions for 300ms after LSP completion insertion
        // This prevents inline completion from appearing immediately after accepting LSP completion
        const timeSinceLspInsertion = Date.now() - lspInsertionTimeRef.current;
        const LSP_SUPPRESSION_MS = 300;
        if (timeSinceLspInsertion < LSP_SUPPRESSION_MS) {
          setCurrentCompletion(null);
          return;
        }

        const selection = $getSelection();

        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          setCurrentCompletion(null);
          return;
        }

        const anchorNode = selection.anchor.getNode();

        // Detect content type (code vs prose)
        const contentType = detectContentType(anchorNode);

        // Check if auto-trigger is enabled for this content type
        const contentConfig =
          contentType === 'code' ? config.code : config.prose;
        if (contentConfig.triggerMode !== 'auto') {
          setCurrentCompletion(null);
          return;
        }

        // For code: require JupyterInputNode (backward compatibility)
        if (contentType === 'code') {
          const jupyterInputNode = findJupyterInputParent(anchorNode);
          if (!jupyterInputNode) {
            setCurrentCompletion(null);
            return;
          }

          // Get cell text and cursor position
          const cellText = jupyterInputNode.getTextContent();
          const cursorOffset = getCursorOffset(jupyterInputNode, selection);

          // Check if cell text actually changed (not just cursor movement)
          if (cellText === lastCellTextRef.current) {
            return;
          }

          // Update last cell text
          lastCellTextRef.current = cellText;

          // Check if there's ANY non-whitespace content before cursor
          const textBeforeCursor = cellText.substring(0, cursorOffset);

          if (textBeforeCursor.trim().length === 0) {
            setCurrentCompletion(null);
            return;
          }

          // Check if current line is empty
          const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
          const currentLineBeforeCursor = textBeforeCursor.substring(lineStart);
          if (currentLineBeforeCursor.trim().length === 0) {
            setCurrentCompletion(null);
            return;
          }

          // Only request at end of line
          const textAfterCursor = cellText.substring(cursorOffset);
          const nextNewline = textAfterCursor.indexOf('\n');
          const textAfterCursorOnLine =
            nextNewline === -1
              ? textAfterCursor
              : textAfterCursor.substring(0, nextNewline);

          if (textAfterCursorOnLine.trim().length > 0) {
            let hasCompletionNode = false;
            const children = jupyterInputNode.getChildren();
            for (const child of children) {
              if ($isInlineCompletionNode(child)) {
                hasCompletionNode = true;
                break;
              }
            }

            if (!hasCompletionNode) {
              setCurrentCompletion(null);
              return;
            }
          }

          // Debounce requests
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          const requestKey = `${cellText}:${cursorOffset}`;

          if (cellText.trim().length < 2) {
            setCurrentCompletion(null);
            lastRequestRef.current = '';
            return;
          }

          // Schedule timer
          debounceTimerRef.current = setTimeout(() => {
            if (requestKey !== lastRequestRef.current) {
              lastRequestRef.current = requestKey;
              requestCompletionRef.current?.(
                cellText,
                cursorOffset,
                contentConfig.language || 'python',
                'code',
              );
            }
          }, debounceMs);
        } else {
          // Prose content - extract context and request completion
          const context = extractContext(
            contentType,
            anchorNode,
            selection,
            contentConfig.contextBefore,
            contentConfig.contextAfter,
          );

          // Check if text actually changed
          if (context.fullText === lastCellTextRef.current) {
            return;
          }

          lastCellTextRef.current = context.fullText;

          // Minimum content check
          if (context.before.trim().length < 10) {
            setCurrentCompletion(null);
            return;
          }

          // Debounce requests
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          const requestKey = `prose:${context.fullText.length}`;

          // Schedule timer
          debounceTimerRef.current = setTimeout(() => {
            if (requestKey !== lastRequestRef.current) {
              lastRequestRef.current = requestKey;
              // Request prose completion with extracted context
              requestCompletionRef.current?.(
                context.fullText,
                context.before.length, // Cursor offset is at end of "before" text
                contentConfig.language || 'markdown',
                'prose',
              );
            }
          }, debounceMs);
        }
      });
    });
  }, [editor, enabled, debounceMs, config.code, config.prose, lspMenuOpen]);

  /**
   * Insert/update/remove the InlineCompletionNode based on currentCompletion
   */
  useEffect(() => {
    if (!enabled) return;

    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      // Remove existing completion node
      if (completionNodeKeyRef.current) {
        const existingNode = $getNodeByKey(completionNodeKeyRef.current);
        if (existingNode && $isInlineCompletionNode(existingNode)) {
          existingNode.remove();
        }
        completionNodeKeyRef.current = null;
      }

      // Insert new completion node if we have completion text
      if (currentCompletion && currentCompletion.trim().length > 0) {
        const completionNode = $createInlineCompletionNode(currentCompletion);

        // Insert completion node at cursor position
        // Get anchor node and insert without breaking selection
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;

        // Handle different node types at cursor
        if (anchorNode.getType() === 'text') {
          const textNode = anchorNode as any; // TextNode

          // Split text at cursor: "hello|world" -> "hello" + completion + "world"
          const splitNodes = textNode.splitText(anchorOffset);
          const nodeAfterSplit = splitNodes[0];

          // Insert completion after the first part
          nodeAfterSplit.insertAfter(completionNode);
        } else if (anchorNode.getType() === 'jupyter-input-highlight') {
          // We're in a syntax highlight wrapper - insert after it
          anchorNode.insertAfter(completionNode);
        } else {
          // For any other node type, insert after it
          anchorNode.insertAfter(completionNode);
        }

        completionNodeKeyRef.current = completionNode.getKey();
      }
    });
  }, [editor, currentCompletion, enabled]);

  /**
   * Use NodeTransform to continuously re-add completion node after JupyterInputOutputPlugin updates
   * This ensures the completion persists even when JupyterInputNode is recreated
   */
  useEffect(() => {
    if (!enabled || !currentCompletion) return;

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
          const completionNode = $createInlineCompletionNode(currentCompletion);

          // Insert at cursor position, not at end
          const anchorNode = selection.anchor.getNode();
          const anchorOffset = selection.anchor.offset;

          // Use same insertion logic as initial insert
          if (anchorNode.getType() === 'text') {
            const textNode = anchorNode as any;
            const splitNodes = textNode.splitText(anchorOffset);
            const nodeAfterSplit = splitNodes[0];
            nodeAfterSplit.insertAfter(completionNode);
          } else if (anchorNode.getType() === 'jupyter-input-highlight') {
            anchorNode.insertAfter(completionNode);
          } else {
            anchorNode.insertAfter(completionNode);
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

              // FIX: Move cursor to end of inserted text
              // Select the entire inserted text node
              textNode.select();
              // Then collapse the selection to the end
              const newSelection = $getSelection();
              if ($isRangeSelection(newSelection)) {
                newSelection.anchor.set(
                  textNode.getKey(),
                  currentCompletion.length,
                  'text',
                );
                newSelection.focus.set(
                  textNode.getKey(),
                  currentCompletion.length,
                  'text',
                );
              }
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

  /**
   * Keyboard shortcut listener for manual trigger
   */
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier-only key events (Alt, Control, Meta, Shift, Dead, etc.)
      const modifierKeys = [
        'Alt',
        'AltGraph',
        'Control',
        'Meta',
        'Shift',
        'Dead',
        'CapsLock',
        'NumLock',
        'ScrollLock',
        'Fn',
      ];
      if (modifierKeys.includes(event.key)) {
        return; // Skip modifier-only events
      }

      if (matchesShortcut(event, config.manualTriggerKey)) {
        event.preventDefault();
        editor.dispatchCommand(TRIGGER_INLINE_COMPLETION_COMMAND, undefined);
      }
    };

    const rootElement = editor.getRootElement();

    if (rootElement) {
      rootElement.addEventListener('keydown', handleKeyDown);

      return () => {
        rootElement.removeEventListener('keydown', handleKeyDown);
      };
    }

    return undefined;
  }, [editor, enabled, config.manualTriggerKey]);

  /**
   * Handle manual trigger command (e.g., Ctrl+Space)
   * Supports both code and prose content types
   */
  useEffect(() => {
    if (!enabled) return;

    return editor.registerCommand(
      TRIGGER_INLINE_COMPLETION_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return;
          }

          const anchorNode = selection.anchor.getNode();

          // Detect content type
          const contentType = detectContentType(anchorNode);

          // Check if manual trigger is enabled for this content type
          const contentConfig =
            contentType === 'code' ? config.code : config.prose;
          if (contentConfig.triggerMode === 'disabled') {
            return;
          }

          // Clear any pending debounce timer
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = null;
          }

          if (contentType === 'code') {
            // Code cell manual trigger
            const jupyterInputNode = findJupyterInputParent(anchorNode);

            if (!jupyterInputNode) {
              return;
            }

            const cellText = jupyterInputNode.getTextContent();
            const cursorOffset = getCursorOffset(jupyterInputNode, selection);

            const requestKey = `${cellText}:${cursorOffset}`;
            lastRequestRef.current = requestKey;
            requestCompletionRef.current?.(
              cellText,
              cursorOffset,
              contentConfig.language || 'python',
              'code',
            );
          } else {
            // Prose manual trigger
            const context = extractContext(
              contentType,
              anchorNode,
              selection,
              contentConfig.contextBefore,
              contentConfig.contextAfter,
            );

            // Minimum content check
            if (context.before.trim().length < 10) {
              return;
            }

            const requestKey = `prose:manual:${context.fullText.length}`;
            lastRequestRef.current = requestKey;
            requestCompletionRef.current?.(
              context.fullText,
              context.before.length,
              contentConfig.language || 'markdown',
              'prose',
            );
          }
        });

        return true;
      },
      COMMAND_PRIORITY_HIGH,
    );
  }, [editor, enabled, config]);

  return null;
}

/**
 * Map of friendly key names to event.code values for physical key matching.
 * Using event.code instead of event.key because Alt/Option on Mac produces special characters.
 */
const KEY_CODE_MAP: Record<string, string> = {
  space: 'Space',
  enter: 'Enter',
  tab: 'Tab',
  escape: 'Escape',
  backspace: 'Backspace',
  delete: 'Delete',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  // Letter keys
  a: 'KeyA',
  b: 'KeyB',
  c: 'KeyC',
  d: 'KeyD',
  e: 'KeyE',
  f: 'KeyF',
  g: 'KeyG',
  h: 'KeyH',
  i: 'KeyI',
  j: 'KeyJ',
  k: 'KeyK',
  l: 'KeyL',
  m: 'KeyM',
  n: 'KeyN',
  o: 'KeyO',
  p: 'KeyP',
  q: 'KeyQ',
  r: 'KeyR',
  s: 'KeyS',
  t: 'KeyT',
  u: 'KeyU',
  v: 'KeyV',
  w: 'KeyW',
  x: 'KeyX',
  y: 'KeyY',
  z: 'KeyZ',
};

/**
 * Parse keyboard shortcut string and check if event matches.
 * Supports format: "Modifier+Key" (e.g., "Ctrl+Space", "Cmd+Shift+I")
 * Uses event.code for key matching to handle Mac Option key correctly.
 *
 * @param event - Keyboard event to check
 * @param shortcut - Shortcut string from config
 * @returns True if event matches shortcut
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.split('+').map(s => s.trim().toLowerCase());
  const key = parts[parts.length - 1]; // Last part is the key
  const modifiers = parts.slice(0, -1); // Everything else is modifiers

  // Map key name to event.code (e.g., 'i' -> 'KeyI', 'space' -> 'Space')
  const expectedCode = KEY_CODE_MAP[key];
  if (!expectedCode) {
    // Fallback to event.key for unmapped keys
    const eventKey = event.key.toLowerCase();
    if (eventKey !== key) {
      return false;
    }
  } else {
    // Use event.code for reliable key matching (works with Alt/Option on Mac)
    if (event.code !== expectedCode) {
      return false;
    }
  }

  // Check modifiers
  const hasCtrl = modifiers.includes('ctrl');
  const hasCmd = modifiers.includes('cmd') || modifiers.includes('meta');
  const hasShift = modifiers.includes('shift');
  const hasAlt = modifiers.includes('alt');

  // Check specific modifier requirements
  if (hasCtrl && !event.ctrlKey) {
    return false;
  }

  if (hasCmd && !event.metaKey) {
    return false;
  }

  if (hasShift && !event.shiftKey) {
    return false;
  }

  if (hasAlt && !event.altKey) {
    return false;
  }

  return true;
}

/**
 * Detect content type based on cursor position.
 * Returns 'code' if inside a JupyterInputNode, 'prose' otherwise.
 *
 * @param anchorNode - The node at the cursor position
 * @returns 'code' or 'prose'
 */
function detectContentType(anchorNode: LexicalNode): 'code' | 'prose' {
  let current: LexicalNode | null = anchorNode;

  // Traverse up the tree looking for JupyterInputNode
  while (current) {
    if ($isJupyterInputNode(current)) {
      return 'code';
    }
    current = current.getParent();
  }

  // Not in a Jupyter cell - must be prose
  return 'prose';
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
