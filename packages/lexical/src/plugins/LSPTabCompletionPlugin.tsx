/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * LSP Tab completion plugin for Lexical editor.
 * Provides dropdown menu completions from Pylance and Markdown language servers.
 * Triggered by Tab key or Ctrl+Space in code blocks.
 *
 * @module lexical/plugins/LSPTabCompletionPlugin
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isElementNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_TAB_COMMAND,
  createCommand,
  type LexicalNode,
  type LexicalCommand,
} from 'lexical';

import {
  $isJupyterInputNode,
  type JupyterInputNode,
} from '../nodes/JupyterInputNode';
import { $isInlineCompletionNode } from '../nodes/InlineCompletionNode';
import { LSPCompletionMenu } from './LSPCompletionMenu';
import type {
  ILSPCompletionProvider,
  LSPCompletionItem,
  CellLanguage,
} from './lspTypes';

/**
 * Command to signal LSP completion menu state change.
 * Payload: true = menu opened, false = menu closed
 */
export const LSP_MENU_STATE_COMMAND: LexicalCommand<boolean> = createCommand(
  'LSP_MENU_STATE_COMMAND',
);

/**
 * Command to signal LSP completion was inserted.
 * Dispatched after inserting completion text to suppress inline completions.
 */
export const LSP_COMPLETION_INSERTED_COMMAND: LexicalCommand<void> =
  createCommand('LSP_COMPLETION_INSERTED_COMMAND');

/**
 * Calculate absolute offset from start of JupyterInputNode to current selection position.
 * selection.anchor.offset gives offset within current text node, not within entire node.
 */
function getAbsoluteOffset(
  jupyterInputNode: JupyterInputNode,
  anchorNode: LexicalNode,
  anchorOffset: number,
): number {
  // Walk through children to find cumulative offset
  let cumulativeOffset = 0;

  function traverse(node: LexicalNode): boolean {
    if (node === anchorNode) {
      // Found the anchor node - add its internal offset
      cumulativeOffset += anchorOffset;
      return true;
    }

    // If this is an element node, traverse its children
    if ($isElementNode(node)) {
      const children = node.getChildren();
      for (const child of children) {
        if (traverse(child)) {
          return true;
        }
      }
    } else {
      // Text or other leaf node - add its length
      cumulativeOffset += node.getTextContent().length;
    }

    return false;
  }

  // Start traversal from JupyterInputNode's children
  const children = jupyterInputNode.getChildren();
  for (const child of children) {
    if (traverse(child)) {
      break;
    }
  }

  return cumulativeOffset;
}

/**
 * Check if there's an active inline completion in the given JupyterInputNode.
 * If inline completion is active, let it handle Tab (higher priority).
 */
function hasActiveInlineCompletion(parentNode: JupyterInputNode): boolean {
  const children = parentNode.getChildren();

  for (const child of children) {
    if ($isInlineCompletionNode(child)) {
      return true;
    }
  }

  return false;
}

/**
 * Find the JupyterInputNode parent of a node
 */
function findJupyterInputParent(node: LexicalNode): JupyterInputNode | null {
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
 * Convert character offset to line/character position
 */
function offsetToPosition(
  text: string,
  offset: number,
): { line: number; character: number } {
  let line = 0;
  let character = 0;

  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      character = 0;
    } else {
      character++;
    }
  }

  return { line, character };
}

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
 * LSP Tab completion plugin props
 */
export interface LSPTabCompletionPluginProps {
  /** LSP completion providers */
  providers: ILSPCompletionProvider[];

  /** Disable the plugin */
  disabled?: boolean;
}

/**
 * LSP Tab completion plugin.
 * Shows dropdown menu with LSP completions when Tab is pressed in code blocks.
 * Coexists with inline LLM completions (inline takes precedence).
 */
/**
 * Filter and sort completion items based on typed text.
 * Prioritizes exact prefix matches over partial matches.
 */
function filterAndSortCompletions(
  items: LSPCompletionItem[],
  filterText: string,
): LSPCompletionItem[] {
  if (!filterText) {
    return items;
  }

  const lowerFilter = filterText.toLowerCase();

  // Separate exact prefix matches from partial matches
  const exactMatches: LSPCompletionItem[] = [];
  const partialMatches: LSPCompletionItem[] = [];

  for (const item of items) {
    const searchText = (item.filterText || item.label).toLowerCase();

    if (searchText.startsWith(lowerFilter)) {
      exactMatches.push(item);
    } else if (searchText.includes(lowerFilter)) {
      partialMatches.push(item);
    }
    // Non-matches are excluded
  }

  // Return exact matches first, then partial matches
  return [...exactMatches, ...partialMatches];
}

export function LSPTabCompletionPlugin({
  providers,
  disabled = false,
}: LSPTabCompletionPluginProps): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const [allCompletions, setAllCompletions] = useState<LSPCompletionItem[]>([]); // Cache all fetched completions
  const [filteredCompletions, setFilteredCompletions] = useState<
    LSPCompletionItem[]
  >([]); // Displayed completions
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [currentFilterText, setCurrentFilterText] = useState<string>(''); // Current filter text for highlighting

  // Track the cursor offset when menu first opens (to calculate filter text)
  const menuOpenOffsetRef = useRef<number>(0);
  const jupyterInputNodeRef = useRef<JupyterInputNode | null>(null);

  // Get cursor position for menu placement
  const getCursorPosition = useCallback((): { top: number; left: number } => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return { top: 0, left: 0 };
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    };
  }, []);

  // Handle menu close
  const handleCloseMenu = useCallback(() => {
    setIsMenuOpen(false);
    setAllCompletions([]);
    setFilteredCompletions([]);
    setCurrentFilterText('');
    menuOpenOffsetRef.current = 0;
    jupyterInputNodeRef.current = null;
    // Signal to other plugins that menu is closed
    editor.dispatchCommand(LSP_MENU_STATE_COMMAND, false);
  }, [editor]);

  // Handle completion selection
  const handleSelectCompletion = useCallback(
    (item: LSPCompletionItem) => {
      editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return;
        }

        // Get current text to calculate how much to replace
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;
        const jupyterInputNode = jupyterInputNodeRef.current;

        if (jupyterInputNode) {
          // Calculate current absolute offset
          const currentOffset = getAbsoluteOffset(
            jupyterInputNode,
            anchorNode,
            anchorOffset,
          );
          const filterTextLength = currentOffset - menuOpenOffsetRef.current;

          // If user typed text after menu opened, we need to delete it before inserting completion
          if (filterTextLength > 0) {
            const deleteStart = anchorOffset - filterTextLength;

            if (deleteStart >= 0) {
              // Select the typed text to replace it
              const nodeKey = anchorNode.getKey();
              selection.anchor.set(nodeKey, deleteStart, 'text');
              selection.focus.set(nodeKey, anchorOffset, 'text');
            }
          }
        }

        // Insert completion text (replaces the selected text if any)
        selection.insertText(item.insertText);
      });

      // Signal that LSP completion was inserted (suppresses inline completions)
      editor.dispatchCommand(LSP_COMPLETION_INSERTED_COMMAND, undefined);

      // Close menu - use handleCloseMenu to dispatch state command
      handleCloseMenu();
    },
    [editor, handleCloseMenu],
  );

  // Listen for text changes while menu is open to filter completions dynamically
  useEffect(() => {
    if (!isMenuOpen || allCompletions.length === 0) {
      return;
    }

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          handleCloseMenu();
          return;
        }

        const anchorNode = selection.anchor.getNode();
        const jupyterInputNode = jupyterInputNodeRef.current;

        if (!jupyterInputNode) {
          return;
        }

        // Check if we're still in the same JupyterInputNode (compare by UUID, not reference)
        const currentJupyterNode = findJupyterInputParent(anchorNode);
        if (!currentJupyterNode) {
          handleCloseMenu();
          return;
        }

        // Compare by UUID instead of reference (Lexical may recreate nodes)
        const currentUuid = currentJupyterNode.getJupyterInputNodeUuid();
        const originalUuid = jupyterInputNode.getJupyterInputNodeUuid();
        if (currentUuid !== originalUuid) {
          handleCloseMenu();
          return;
        }

        // Update ref to current node (Lexical may have recreated it)
        jupyterInputNodeRef.current = currentJupyterNode;

        // Calculate current absolute offset
        const anchorOffset = selection.anchor.offset;
        const currentOffset = getAbsoluteOffset(
          currentJupyterNode,
          anchorNode,
          anchorOffset,
        );

        // If cursor moved before the menu open position, close menu
        if (currentOffset < menuOpenOffsetRef.current) {
          handleCloseMenu();
          return;
        }

        // Extract the text typed after menu opened (filter text)
        const content = currentJupyterNode.getTextContent();
        const filterText = content.substring(
          menuOpenOffsetRef.current,
          currentOffset,
        );

        // Filter and sort completions
        const filtered = filterAndSortCompletions(allCompletions, filterText);

        // Update filtered completions and filter text for highlighting
        setFilteredCompletions(filtered);
        setCurrentFilterText(filterText);

        // Close menu if no matches
        if (filtered.length === 0) {
          handleCloseMenu();
        }
      });
    });
  }, [editor, isMenuOpen, allCompletions, handleCloseMenu]);

  // Fetch completions from providers
  const fetchCompletions = useCallback(
    async (node: JupyterInputNode, offset: number) => {
      if (providers.length === 0 || disabled) {
        return;
      }

      const nodeUuid = node.getJupyterInputNodeUuid();
      const content = node.getTextContent();
      const language = detectCellLanguage(node);

      // Only fetch for supported languages
      if (language === 'unknown') {
        return;
      }

      const position = offsetToPosition(content, offset);

      // Fetch from all providers (typically just one)
      const results = await Promise.all(
        providers.map(provider =>
          provider.fetchCompletions(nodeUuid, content, position, language),
        ),
      );

      // Merge results from all providers
      const fetchedCompletions = results.flat();

      // Handle completions based on count
      if (fetchedCompletions.length === 1) {
        // Single completion - insert directly without showing menu
        const item = fetchedCompletions[0];
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Get the text before cursor to find the prefix to replace
            const anchorNode = selection.anchor.getNode();
            const anchorOffset = selection.anchor.offset;
            const textContent = anchorNode.getTextContent();

            // Find the start of the current word (scan backward until non-identifier char)
            let wordStart = anchorOffset;
            while (
              wordStart > 0 &&
              /[a-zA-Z0-9_]/.test(textContent[wordStart - 1])
            ) {
              wordStart--;
            }

            const prefixLength = anchorOffset - wordStart;

            if (prefixLength > 0) {
              // Select the prefix by setting anchor at word start and focus at cursor
              const nodeKey = anchorNode.getKey();
              selection.anchor.set(nodeKey, wordStart, 'text');
              selection.focus.set(nodeKey, anchorOffset, 'text');
            }

            // Insert completion text (replaces the selected prefix)
            selection.insertText(item.insertText);
          }
        });

        // Signal that LSP completion was inserted (suppresses inline completions)
        editor.dispatchCommand(LSP_COMPLETION_INSERTED_COMMAND, undefined);
      } else if (fetchedCompletions.length > 1) {
        // Multiple completions - show menu with dynamic filtering
        const position = getCursorPosition();
        setMenuPosition(position);

        // Store all completions for filtering
        setAllCompletions(fetchedCompletions);

        // Initially show all completions (no filter text yet)
        setFilteredCompletions(fetchedCompletions);
        setCurrentFilterText('');

        // Track where the menu opened (for calculating filter text)
        menuOpenOffsetRef.current = offset;
        jupyterInputNodeRef.current = node;

        setIsMenuOpen(true);
        // Signal to other plugins that menu is opened
        editor.dispatchCommand(LSP_MENU_STATE_COMMAND, true);
      }
    },
    [providers, disabled, getCursorPosition, editor],
  );

  // Register Tab key command with VERY_HIGH priority
  useEffect(() => {
    if (disabled) {
      return;
    }

    return editor.registerCommand(
      KEY_TAB_COMMAND,
      (event: KeyboardEvent | null) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return false;
        }

        const node = selection.anchor.getNode();
        const jupyterInputNode = findJupyterInputParent(node);

        if (!jupyterInputNode) {
          return false; // Not in a code block
        }

        // If inline completion is active, let it handle Tab
        if (hasActiveInlineCompletion(jupyterInputNode)) {
          return false;
        }

        // If menu is already open, LSPCompletionMenu will handle Tab navigation/selection
        // We return true to prevent default Tab behavior (inserting tab character)
        if (isMenuOpen) {
          event?.preventDefault();
          return true; // Let LSPCompletionMenu's keydown handler do the actual selection
        }

        // Prevent default Tab behavior and fetch completions
        event?.preventDefault();

        // Calculate absolute offset from start of JupyterInputNode
        const anchorNode = selection.anchor.getNode();
        const anchorOffset = selection.anchor.offset;
        const absoluteOffset = getAbsoluteOffset(
          jupyterInputNode,
          anchorNode,
          anchorOffset,
        );

        // Fetch completions
        fetchCompletions(jupyterInputNode, absoluteOffset);

        return true; // Command handled
      },
      COMMAND_PRIORITY_CRITICAL, // Higher than AutoIndentPlugin (HIGH)
    );
  }, [editor, disabled, isMenuOpen, fetchCompletions]);

  if (disabled || providers.length === 0) {
    return null;
  }

  return isMenuOpen && filteredCompletions.length > 0 ? (
    <LSPCompletionMenu
      items={filteredCompletions}
      onSelect={handleSelectCompletion}
      onClose={handleCloseMenu}
      position={menuPosition}
      filterText={currentFilterText}
    />
  ) : null;
}
