/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * AutoIndent Plugin
 *
 * Provides language-aware automatic indentation for code cells.
 * Overrides default Tab and Enter key behavior with intelligent indentation.
 *
 * @module plugins/AutoIndentPlugin
 */

import { useEffect, useRef } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  KEY_TAB_COMMAND,
  KEY_ENTER_COMMAND,
  $createLineBreakNode,
  LexicalNode,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';

import { AutoIndentEngine } from '../autoindent/AutoIndentEngine';
import { LanguageIndentRegistry } from '../autoindent/LanguageIndentRegistry';
import type { AutoIndentOptions } from '../autoindent/types';
import {
  $isJupyterInputNode,
  JupyterInputNode,
} from '../nodes/JupyterInputNode';
import { $createJupyterInputHighlightNode } from '../nodes/JupyterInputHighlightNode';

export interface AutoIndentPluginProps extends AutoIndentOptions {
  /** Enable the plugin (default: true) */
  enabled?: boolean;
}

/**
 * AutoIndent Plugin for Lexical Editor
 *
 * Provides intelligent, language-aware code indentation:
 * - Tab inserts language-specific spaces (Python=4, JavaScript=2)
 * - Enter automatically indents based on line context
 * - Supports Python colon indentation, JavaScript brace indentation
 *
 * @example
 * ```tsx
 * <LexicalComposer>
 *   <AutoIndentPlugin defaultLanguage="python" />
 *   <RichTextPlugin ... />
 * </LexicalComposer>
 * ```
 */
export function AutoIndentPlugin({
  enabled = true,
  defaultLanguage = 'python',
  customConfigs = [],
  debug = false,
  fallbackTabSize = 4,
  preserveTabs = false,
}: AutoIndentPluginProps): null {
  const [editor] = useLexicalComposerContext();

  // Create registry and engine (stable references)
  const registryRef = useRef<LanguageIndentRegistry>();
  const engineRef = useRef<AutoIndentEngine>();

  if (!registryRef.current) {
    registryRef.current = new LanguageIndentRegistry({
      defaultLanguage,
      customConfigs,
      debug,
      fallbackTabSize,
      preserveTabs,
    });
  }

  if (!engineRef.current) {
    engineRef.current = new AutoIndentEngine(registryRef.current, debug);
  }

  const engine = engineRef.current;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return mergeRegister(
      // Handle Tab key press (KEY_TAB_COMMAND)
      editor.registerCommand(
        KEY_TAB_COMMAND,
        (event: KeyboardEvent | null) => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Check if we're inside a JupyterInputNode
          const anchorNode = selection.anchor.getNode();
          const parentCodeBlock = getParentJupyterInputNode(anchorNode);

          if (!parentCodeBlock) {
            // Not in code block, let default Tab behavior happen
            return false;
          }

          // Prevent default Tab behavior (focus navigation)
          event?.preventDefault();

          // Get language from parent JupyterInputNode
          const language = parentCodeBlock.getLanguage() || defaultLanguage;

          // Get tab string for language
          const tabString = engine.getTabString(language);

          if (debug) {
            console.log(
              `[AutoIndentPlugin] Tab key pressed - Language: ${language}, inserting: ${JSON.stringify(tabString)}`,
            );
          }

          // Insert tab at cursor or indent selected lines
          if (selection.isCollapsed()) {
            // Single cursor - insert tab
            selection.insertText(tabString);
          } else {
            // Multi-line selection - indent all lines
            indentSelectedLines(selection, tabString);
          }

          return true; // Handled - prevent default behavior
        },
        COMMAND_PRIORITY_HIGH, // Higher priority to handle Tab before InlineCompletion fallback
      ),

      // Handle INDENT_CONTENT_COMMAND (for toolbar buttons, Cmd+])
      editor.registerCommand(
        INDENT_CONTENT_COMMAND,
        () => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Get language from parent JupyterInputNode
          const language = getLanguageFromSelection(selection);

          // Get tab string for language
          const tabString = engine.getTabString(language);

          if (debug) {
            console.log(
              `[AutoIndentPlugin] INDENT_CONTENT_COMMAND - Language: ${language}, inserting: ${JSON.stringify(tabString)}`,
            );
          }

          // Insert tab at cursor or indent selected lines
          if (selection.isCollapsed()) {
            // Single cursor - insert tab
            selection.insertText(tabString);
          } else {
            // Multi-line selection - indent all lines
            indentSelectedLines(selection, tabString);
          }

          return true; // Prevent default behavior
        },
        COMMAND_PRIORITY_HIGH, // Override default indent behavior
      ),

      // Handle Enter key press (KEY_ENTER_COMMAND) for autoindent
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        (event: KeyboardEvent | null) => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          // Check if we're inside a JupyterInputNode
          const anchorNode = selection.anchor.getNode();
          const parentCodeBlock = getParentJupyterInputNode(anchorNode);

          if (!parentCodeBlock) {
            // Not in code block, use default behavior
            return false;
          }

          // Skip if Shift+Enter (that's for code execution)
          if (event?.shiftKey) {
            return false;
          }

          // Prevent default Enter behavior
          event?.preventDefault();

          const language = parentCodeBlock.getLanguage() || defaultLanguage;

          // Get current line text
          const currentLine = getCurrentLineText(selection);
          const trimmedLine = currentLine.trim();
          const isEmptyLine = trimmedLine.length === 0;

          if (debug) {
            console.log(
              `[AutoIndentPlugin] Enter key pressed in ${language} cell - Current line: "${currentLine}", isEmpty: ${isEmptyLine}`,
            );
          }

          let indentSpaces: number;

          // For empty lines, preserve current indentation
          // For non-empty lines, calculate based on content
          if (isEmptyLine) {
            if (debug) {
              console.log(
                `[AutoIndentPlugin] Empty line detected - about to clear whitespace`,
              );
            }

            // Clear whitespace from current line before moving to next
            clearCurrentLineWhitespace(selection, debug);

            // Preserve current line's indentation for new line
            indentSpaces = engine.getLeadingWhitespace(currentLine).length;

            if (debug) {
              console.log(
                `[AutoIndentPlugin] Empty line - cleared whitespace, preserving ${indentSpaces} spaces for new line`,
              );
            }
          } else {
            // Calculate indentation for new line based on current line content
            const indentResult = engine.calculateIndent({
              currentLine,
              language,
              currentIndent: engine.getLeadingWhitespace(currentLine).length,
            });

            indentSpaces = indentResult.spaces;

            if (debug) {
              console.log(`[AutoIndentPlugin] Indent result:`, indentResult);
            }
          }

          // Insert line break
          selection.insertNodes([$createLineBreakNode()]);

          // Insert indentation
          if (indentSpaces > 0) {
            const indentText = ' '.repeat(indentSpaces);
            const indentNode = $createJupyterInputHighlightNode(indentText);
            selection.insertNodes([indentNode]);

            if (debug) {
              console.log(`[AutoIndentPlugin] Inserted ${indentSpaces} spaces`);
            }
          }

          return true; // Handled - prevent default behavior
        },
        COMMAND_PRIORITY_HIGH, // Higher priority than JupyterInputOutputPlugin's COMMAND_PRIORITY_LOW
      ),

      // Handle Shift+Tab (outdent)
      editor.registerCommand(
        OUTDENT_CONTENT_COMMAND,
        () => {
          const selection = $getSelection();

          if (!$isRangeSelection(selection)) {
            return false;
          }

          const language = getLanguageFromSelection(selection);
          const tabSize = engine.getTabSize(language);

          // Outdent selected lines
          outdentSelectedLines(selection, tabSize);

          return true; // Prevent default behavior
        },
        COMMAND_PRIORITY_HIGH,
      ),
    );
  }, [editor, enabled, defaultLanguage, debug]);

  return null;
}

/**
 * Get language from current selection context
 */
function getLanguageFromSelection(
  selection: ReturnType<typeof $getSelection>,
): string | null {
  if (!$isRangeSelection(selection)) {
    return null;
  }

  const anchorNode = selection.anchor.getNode();
  const parentCodeBlock = getParentJupyterInputNode(anchorNode);

  return parentCodeBlock?.getLanguage() || 'python';
}

/**
 * Get parent JupyterInputNode from a node
 */
function getParentJupyterInputNode(node: LexicalNode): JupyterInputNode | null {
  let current: LexicalNode | null = node;

  while (current) {
    if ($isJupyterInputNode(current)) {
      return current;
    }
    current = current.getParent();
  }

  return null;
}

/**
 * Get current line text from selection
 * Collects all text from the start of the line (after previous linebreak) to cursor
 */
function getCurrentLineText(
  selection: ReturnType<typeof $getSelection>,
): string {
  if (!$isRangeSelection(selection)) {
    return '';
  }

  const anchorNode = selection.anchor.getNode();
  let currentNode: LexicalNode | null = anchorNode;

  // Collect all text nodes on the current line (backwards from cursor)
  const lineTextParts: string[] = [];

  // If anchor is a text node, include its content
  if ($isTextNode(currentNode)) {
    lineTextParts.unshift(currentNode.getTextContent());
    currentNode = currentNode.getPreviousSibling();
  } else {
    // If anchor is not a text node, start from previous sibling
    currentNode = currentNode.getPreviousSibling();
  }

  // Walk backwards collecting text until we hit a linebreak or null
  while (currentNode) {
    if (currentNode.getType() === 'linebreak') {
      break;
    }
    if ($isTextNode(currentNode)) {
      lineTextParts.unshift(currentNode.getTextContent());
    }
    currentNode = currentNode.getPreviousSibling();
  }

  return lineTextParts.join('');
}

/**
 * Clear whitespace from current line if it's empty
 * Removes trailing spaces from empty indented lines
 */
function clearCurrentLineWhitespace(
  selection: ReturnType<typeof $getSelection>,
  debug = false,
): void {
  if (!$isRangeSelection(selection)) {
    if (debug) {
      console.log('[clearCurrentLineWhitespace] Not a range selection');
    }
    return;
  }

  const anchorNode = selection.anchor.getNode();
  let currentNode: LexicalNode | null = anchorNode;

  if (debug) {
    console.log('[clearCurrentLineWhitespace] Starting with anchor node:', {
      type: anchorNode.getType(),
      isTextNode: $isTextNode(anchorNode),
      content: $isTextNode(anchorNode) ? anchorNode.getTextContent() : 'N/A',
    });
  }

  // Collect all text nodes on the current line
  const lineNodes: LexicalNode[] = [];

  // If anchor is a text node, include it
  if ($isTextNode(currentNode)) {
    lineNodes.push(currentNode);
    currentNode = currentNode.getPreviousSibling();
  } else {
    currentNode = currentNode.getPreviousSibling();
  }

  // Walk backwards collecting text nodes until we hit a linebreak
  while (currentNode) {
    if (currentNode.getType() === 'linebreak') {
      if (debug) {
        console.log('[clearCurrentLineWhitespace] Hit linebreak, stopping');
      }
      break;
    }
    if ($isTextNode(currentNode)) {
      lineNodes.unshift(currentNode);
    }
    currentNode = currentNode.getPreviousSibling();
  }

  if (debug) {
    console.log(
      `[clearCurrentLineWhitespace] Found ${lineNodes.length} text nodes to clear`,
    );
    lineNodes.forEach((node, i) => {
      if ($isTextNode(node)) {
        console.log(
          `[clearCurrentLineWhitespace]   Node ${i}: "${node.getTextContent()}"`,
        );
      }
    });
  }

  // Clear all text nodes (they're all whitespace if we got here)
  let clearedCount = 0;
  lineNodes.forEach(node => {
    if ($isTextNode(node)) {
      node.setTextContent('');
      clearedCount++;
    }
  });

  if (debug) {
    console.log(`[clearCurrentLineWhitespace] Cleared ${clearedCount} nodes`);
  }
}

/**
 * Indent all selected lines
 */
function indentSelectedLines(
  selection: ReturnType<typeof $getSelection>,
  tabString: string,
): void {
  if (!$isRangeSelection(selection)) {
    return;
  }

  const nodes = selection.getNodes();

  nodes.forEach(node => {
    if ($isTextNode(node)) {
      const text = node.getTextContent();

      // Only indent if node is at start of line
      // Simple heuristic: check if previous sibling is line break or null
      const prevSibling = node.getPreviousSibling();
      if (prevSibling === null || prevSibling.getType() === 'linebreak') {
        node.setTextContent(tabString + text);
      }
    }
  });
}

/**
 * Outdent all selected lines
 */
function outdentSelectedLines(
  selection: ReturnType<typeof $getSelection>,
  tabSize: number,
): void {
  if (!$isRangeSelection(selection)) {
    return;
  }

  const nodes = selection.getNodes();

  nodes.forEach(node => {
    if ($isTextNode(node)) {
      const text = node.getTextContent();

      // Only outdent if node is at start of line
      const prevSibling = node.getPreviousSibling();
      if (prevSibling === null || prevSibling.getType() === 'linebreak') {
        // Remove leading spaces (up to tabSize)
        const leadingSpaces = text.match(/^ {1,}/)?.[0]?.length || 0;
        const spacesToRemove = Math.min(leadingSpaces, tabSize);

        if (spacesToRemove > 0) {
          node.setTextContent(text.substring(spacesToRemove));
        }
      }
    }
  });
}

export default AutoIndentPlugin;
