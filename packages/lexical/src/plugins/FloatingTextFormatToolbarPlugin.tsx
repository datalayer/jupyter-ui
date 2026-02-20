/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * FloatingTextFormatToolbarPlugin - Primer React based floating inline toolbar.
 *
 * Accepts `extraItems` for extensibility (e.g., AI actions from agent-runtimes).
 *
 * @module plugins/FloatingTextFormatToolbarPlugin
 */

import { $isCodeHighlightNode } from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  LexicalEditor,
} from 'lexical';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  BoldIcon,
  CodeIcon,
  CommentIcon,
  ItalicIcon,
  LinkIcon,
  StrikethroughIcon,
} from '@primer/octicons-react';

// @primer/octicons-react does not include an UnderlineIcon.
// Provide a lightweight 16×16 SVG matching the Octicon grid.
const UnderlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.5 2v5.5a3.5 3.5 0 1 0 7 0V2H13v5.5a5 5 0 0 1-10 0V2h1.5Z" />
    <rect x="2" y="14" width="12" height="1.5" rx=".75" />
  </svg>
);

import { FloatingToolbar, type ToolbarItem } from '@datalayer/primer-addons';

import { getSelectedNode } from '../utils';
import { INSERT_INLINE_COMMAND } from './CommentPlugin';

// ------------------------------------------------------------------
// Hook: selection state tracking
// ------------------------------------------------------------------

function useFloatingTextFormatToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLElement,
  setIsLinkEditMode: (value: boolean) => void,
  extraItems?: ToolbarItem[],
): JSX.Element | null {
  const [isText, setIsText] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);

  const updatePopup = useCallback(() => {
    editor.getEditorState().read(() => {
      // Should not to pop up the floating toolbar when using IME input
      if (editor.isComposing()) {
        return;
      }
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();

      if (
        nativeSelection !== null &&
        (!$isRangeSelection(selection) ||
          rootElement === null ||
          !rootElement.contains(nativeSelection.anchorNode))
      ) {
        setIsText(false);
        return;
      }

      if (!$isRangeSelection(selection)) {
        return;
      }

      const node = getSelectedNode(selection);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));

      // Update links
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      if (
        !$isCodeHighlightNode(selection.anchor.getNode()) &&
        selection.getTextContent() !== ''
      ) {
        setIsText($isTextNode(node));
      } else {
        setIsText(false);
      }
    });
  }, [editor]);

  useEffect(() => {
    document.addEventListener('selectionchange', updatePopup);
    return () => {
      document.removeEventListener('selectionchange', updatePopup);
    };
  }, [updatePopup]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        updatePopup();
      }),
      editor.registerRootListener(() => {
        if (editor.getRootElement() === null) {
          setIsText(false);
        }
      }),
      // Hide the floating toolbar when a comment is being added
      editor.registerCommand(
        INSERT_INLINE_COMMAND,
        () => {
          setIsText(false);
          return false; // Don't prevent other handlers from running
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updatePopup]);

  // Build toolbar items from state
  const insertLink = useCallback(() => {
    if (!isLink) {
      setIsLinkEditMode(true);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://example.com');
    } else {
      setIsLinkEditMode(false);
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink, setIsLinkEditMode]);

  const items = useMemo((): ToolbarItem[] => {
    if (!editor.isEditable()) {
      // Read-only: just comments
      return [
        {
          key: 'comment',
          type: 'button',
          order: 100,
          ariaLabel: 'Insert comment',
          icon: CommentIcon,
          onClick: () =>
            editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined),
        },
      ];
    }

    return [
      {
        key: 'bold',
        type: 'button',
        order: 0,
        ariaLabel: 'Format text as bold',
        title: 'Bold',
        icon: BoldIcon,
        isActive: isBold,
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
      },
      {
        key: 'italic',
        type: 'button',
        order: 1,
        ariaLabel: 'Format text as italics',
        title: 'Italic',
        icon: ItalicIcon,
        isActive: isItalic,
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
      },
      {
        key: 'underline',
        type: 'button',
        order: 2,
        ariaLabel: 'Format text to underlined',
        title: 'Underline',
        icon: UnderlineIcon,
        isActive: isUnderline,
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),
      },
      {
        key: 'strikethrough',
        type: 'button',
        order: 3,
        ariaLabel: 'Format text with a strikethrough',
        title: 'Strikethrough',
        icon: StrikethroughIcon,
        isActive: isStrikethrough,
        onClick: () =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
      },
      {
        key: 'subscript',
        type: 'button',
        order: 4,
        ariaLabel: 'Format Subscript',
        title: 'Subscript',
        icon: undefined,
        label: 'x₂',
        isActive: isSubscript,
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'),
      },
      {
        key: 'superscript',
        type: 'button',
        order: 5,
        ariaLabel: 'Format Superscript',
        title: 'Superscript',
        icon: undefined,
        label: 'x²',
        isActive: isSuperscript,
        onClick: () =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'),
      },
      {
        key: 'code',
        type: 'button',
        order: 6,
        ariaLabel: 'Insert code block',
        title: 'Code',
        icon: CodeIcon,
        isActive: isCode,
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
      },
      {
        key: 'link',
        type: 'button',
        order: 7,
        ariaLabel: 'Insert link',
        title: 'Link',
        icon: LinkIcon,
        isActive: isLink,
        onClick: insertLink,
      },
      {
        key: 'comment',
        type: 'button',
        order: 8,
        ariaLabel: 'Insert comment',
        title: 'Comment',
        icon: CommentIcon,
        onClick: () => editor.dispatchCommand(INSERT_INLINE_COMMAND, undefined),
      },
    ];
  }, [
    editor,
    isBold,
    isItalic,
    isUnderline,
    isStrikethrough,
    isSubscript,
    isSuperscript,
    isCode,
    isLink,
    insertLink,
  ]);

  const isVisible = isText && !isLink;

  return (
    <FloatingToolbar
      items={items}
      extraItems={extraItems}
      anchorElement={anchorElem}
      isVisible={isVisible}
      ariaLabel="Floating text format toolbar"
    />
  );
}

// ------------------------------------------------------------------
// Plugin component
// ------------------------------------------------------------------

export function FloatingTextFormatToolbarPlugin({
  anchorElem = document.body,
  setIsLinkEditMode,
  extraItems,
}: {
  anchorElem?: HTMLElement;
  setIsLinkEditMode: (value: boolean) => void;
  /** Extra items from consumers (e.g. AI actions from agent-runtimes) */
  extraItems?: ToolbarItem[];
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  return useFloatingTextFormatToolbar(
    editor,
    anchorElem,
    setIsLinkEditMode,
    extraItems,
  );
}

export default FloatingTextFormatToolbarPlugin;
