/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ToolbarPlugin - Primer React based extensible toolbar for the Lexical editor.
 *
 * Migrated from custom HTML buttons/CSS to Primer React components via
 * the extensible Toolbar component from @datalayer/primer-addons.
 *
 * @module plugins/ToolbarPlugin
 */

import type { JSX } from 'react';
import {
  $isCodeNode,
  getCodeLanguageOptions as getCodeLanguageOptionsPrism,
  normalizeCodeLanguage as normalizeCodeLanguagePrism,
} from '@lexical/code';
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { $isListNode, ListNode } from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import { $isHeadingNode } from '@lexical/rich-text';
import { INSERT_COLLAPSIBLE_COMMAND } from '../CollapsiblePlugin';
import { INSERT_EXCALIDRAW_COMMAND } from '../ExcalidrawPlugin';
import { INSERT_TABLE_WITH_DIALOG_COMMAND } from '../TablePlugin';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
} from '@lexical/selection';
import { $isTableNode, $isTableSelection } from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestNodeOfType,
  $isEditorIsNestedEditor,
  IS_APPLE,
  mergeRegister,
} from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isNodeSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import { Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BoldIcon,
  ChevronDownIcon,
  CodeIcon,
  CommentIcon,
  DashIcon,
  FileMediaIcon,
  HistoryIcon,
  HorizontalRuleIcon,
  ItalicIcon,
  LinkIcon,
  ListOrderedIcon,
  ListUnorderedIcon,
  PaintbrushIcon,
  PlusIcon,
  QuoteIcon,
  ReplyIcon,
  RowsIcon,
  StrikethroughIcon,
  TableIcon,
  TriangleDownIcon,
  TypographyIcon,
  XIcon,
} from '@primer/octicons-react';

// @primer/octicons-react does not include an UnderlineIcon.
// Provide a lightweight 16×16 SVG matching the Octicon grid.
const UnderlineIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M4.5 2v5.5a3.5 3.5 0 1 0 7 0V2H13v5.5a5 5 0 0 1-10 0V2h1.5Z" />
    <rect x="2" y="14" width="12" height="1.5" rx=".75" />
  </svg>
);
import {
  Toolbar,
  type ToolbarItem,
  type ToolbarDropdownOption,
} from '@datalayer/primer-addons';
import { useSettings } from '../../context/SettingsContext';
import {
  blockTypeToBlockName,
  useToolbarState,
} from '../../context/ToolbarContext';
import { useComments } from '../../context/CommentsContext';
import useModal from '../../hooks/useModal';
import catTypingGif from '../../images/yellow-flower-small.jpg';
import { getSelectedNode } from '../../utils/getSelectedNode';
import { sanitizeUrl } from '../../utils/url';
import { EmbedConfigs } from '../AutoEmbedPlugin';
import { InsertEquationDialog } from '../EquationsPlugin';
import {
  INSERT_IMAGE_COMMAND,
  InsertImageDialog,
  InsertImagePayload,
} from '../ImagesPlugin';
import { SHORTCUTS } from '../ShortcutsPlugin/shortcuts';
import {
  clearFormatting,
  formatBulletList,
  formatCheckList,
  formatCode,
  formatHeading,
  formatNumberedList,
  formatParagraph,
  formatQuote,
  updateFontSize,
  updateFontSizeInSelection,
  UpdateFontSizeType,
} from './utils';
import { parseFontSizeForToolbar } from './fontSize';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

const CODE_LANGUAGE_OPTIONS_PRISM: [string, string][] =
  getCodeLanguageOptionsPrism().filter(option =>
    [
      'c',
      'clike',
      'cpp',
      'css',
      'html',
      'java',
      'js',
      'javascript',
      'markdown',
      'objc',
      'objective-c',
      'plain',
      'powershell',
      'py',
      'python',
      'rust',
      'sql',
      'swift',
      'typescript',
      'xml',
    ].includes(option[0]),
  );

const CODE_LANGUAGE_OPTIONS_SHIKI_FALLBACK: [string, string][] =
  CODE_LANGUAGE_OPTIONS_PRISM;

const normalizeCodeLanguageShiki = normalizeCodeLanguagePrism;

const CODE_THEME_OPTIONS_SHIKI: [string, string][] = [
  ['prism', 'Prism (Default)'],
];

const FONT_FAMILY_OPTIONS: [string, string][] = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const ELEMENT_FORMAT_OPTIONS: {
  [key in Exclude<ElementFormatType, ''>]: { name: string };
} = {
  center: { name: 'Center Align' },
  end: { name: 'End Align' },
  justify: { name: 'Justify Align' },
  left: { name: 'Left Align' },
  right: { name: 'Right Align' },
  start: { name: 'Start Align' },
};

// ------------------------------------------------------------------
// Helper: find top-level element
// ------------------------------------------------------------------

function $findTopLevelElement(node: LexicalNode) {
  let topLevelElement =
    node.getKey() === 'root'
      ? node
      : $findMatchingParent(node, e => {
          const parent = e.getParent();
          return parent !== null && $isRootOrShadowRoot(parent);
        });

  if (topLevelElement === null) {
    topLevelElement = node.getTopLevelElementOrThrow();
  }
  return topLevelElement;
}

// ------------------------------------------------------------------
// FontSize custom toolbar item (keeps controlled input behavior)
// ------------------------------------------------------------------

function FontSizeCustomItem({
  editor,
  fontSize,
  disabled,
}: {
  editor: LexicalEditor;
  fontSize: string;
  disabled: boolean;
}) {
  const selectionFontSize = parseFontSizeForToolbar(fontSize).slice(0, -2);
  const [inputValue, setInputValue] = useState<string>(selectionFontSize);

  useEffect(() => {
    setInputValue(selectionFontSize);
  }, [selectionFontSize]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const val = Number(inputValue);
    if (e.key === 'Tab') return;
    if (['e', 'E', '+', '-'].includes(e.key) || isNaN(val)) {
      e.preventDefault();
      setInputValue('');
      return;
    }
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      const clamped = Math.max(8, Math.min(72, val));
      setInputValue(String(clamped));
      updateFontSizeInSelection(editor, String(clamped) + 'px', null);
    }
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <button
        type="button"
        disabled={disabled || Number(inputValue) <= 8}
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.decrement, inputValue)
        }
        aria-label="Decrease font size"
        title={`Decrease font size (${SHORTCUTS.DECREASE_FONT_SIZE})`}
        style={{
          border: 'none',
          background: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <DashIcon size={14} />
      </button>
      <input
        type="number"
        title="Font size"
        value={inputValue}
        disabled={disabled}
        min={8}
        max={72}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        onBlur={() => {
          if (inputValue !== '') {
            const val = Math.max(8, Math.min(72, Number(inputValue)));
            setInputValue(String(val));
            updateFontSizeInSelection(editor, String(val) + 'px', null);
          }
        }}
        style={{
          width: 32,
          textAlign: 'center',
          border: '1px solid var(--borderColor-default, #d0d7de)',
          borderRadius: 6,
          padding: '2px 4px',
          fontSize: 12,
          background: 'transparent',
          color: 'inherit',
        }}
      />
      <button
        type="button"
        disabled={disabled || Number(inputValue) >= 72}
        onClick={() =>
          updateFontSize(editor, UpdateFontSizeType.increment, inputValue)
        }
        aria-label="Increase font size"
        title={`Increase font size (${SHORTCUTS.INCREASE_FONT_SIZE})`}
        style={{
          border: 'none',
          background: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: '4px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <PlusIcon size={14} />
      </button>
    </span>
  );
}

// ------------------------------------------------------------------
// Main ToolbarPlugin Component
// ------------------------------------------------------------------

export function ToolbarPlugin({
  editor,
  activeEditor,
  setActiveEditor,
  setIsLinkEditMode,
  extraItems,
}: {
  editor: LexicalEditor;
  activeEditor: LexicalEditor;
  setActiveEditor: Dispatch<LexicalEditor>;
  setIsLinkEditMode: Dispatch<boolean>;
  /** Extra toolbar items registered by consumers (e.g. agent-runtimes) */
  extraItems?: ToolbarItem[];
}): JSX.Element {
  const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
    null,
  );
  const [modal, showModal] = useModal();
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());
  const { toolbarState, updateToolbarState } = useToolbarState();

  const {
    settings: { isCodeHighlighted, isCodeShiki },
  } = useSettings();

  // --- Toolbar state sync (unchanged logic) ---

  const $handleHeadingNode = useCallback(
    (selectedElement: LexicalNode) => {
      const type = $isHeadingNode(selectedElement)
        ? selectedElement.getTag()
        : selectedElement.getType();
      if (type in blockTypeToBlockName) {
        updateToolbarState(
          'blockType',
          type as keyof typeof blockTypeToBlockName,
        );
      }
    },
    [updateToolbarState],
  );

  const $handleCodeNode = useCallback(
    (element: LexicalNode) => {
      if ($isCodeNode(element)) {
        const language = element.getLanguage();
        updateToolbarState(
          'codeLanguage',
          language
            ? (isCodeHighlighted &&
                (isCodeShiki
                  ? normalizeCodeLanguageShiki(language)
                  : normalizeCodeLanguagePrism(language))) ||
                language
            : '',
        );
        const theme = element.getTheme();
        updateToolbarState('codeTheme', theme || '');
      }
    },
    [updateToolbarState, isCodeHighlighted, isCodeShiki],
  );

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      if (activeEditor !== editor && $isEditorIsNestedEditor(activeEditor)) {
        const rootElement = activeEditor.getRootElement();
        updateToolbarState(
          'isImageCaption',
          !!rootElement?.parentElement?.classList.contains(
            'image-caption-container',
          ),
        );
      } else {
        updateToolbarState('isImageCaption', false);
      }

      const anchorNode = selection.anchor.getNode();
      const element = $findTopLevelElement(anchorNode);
      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      updateToolbarState('isRTL', $isParentElementRTL(selection));

      const node = getSelectedNode(selection);
      const parent = node.getParent();
      const isLink = $isLinkNode(parent) || $isLinkNode(node);
      updateToolbarState('isLink', isLink);

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        updateToolbarState('rootType', 'table');
      } else {
        updateToolbarState('rootType', 'root');
      }

      if (elementDOM !== null) {
        setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          updateToolbarState('blockType', type);
        } else {
          $handleHeadingNode(element);
          $handleCodeNode(element);
        }
      }

      updateToolbarState(
        'fontColor',
        $getSelectionStyleValueForProperty(selection, 'color', '#000'),
      );
      updateToolbarState(
        'bgColor',
        $getSelectionStyleValueForProperty(
          selection,
          'background-color',
          '#fff',
        ),
      );
      updateToolbarState(
        'fontFamily',
        $getSelectionStyleValueForProperty(selection, 'font-family', 'Arial'),
      );

      let matchingParent;
      if ($isLinkNode(parent)) {
        matchingParent = $findMatchingParent(
          node,
          parentNode => $isElementNode(parentNode) && !parentNode.isInline(),
        );
      }
      updateToolbarState(
        'elementFormat',
        $isElementNode(matchingParent)
          ? matchingParent.getFormatType()
          : $isElementNode(node)
            ? node.getFormatType()
            : parent?.getFormatType() || 'left',
      );
    }
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      updateToolbarState('isBold', selection.hasFormat('bold'));
      updateToolbarState('isItalic', selection.hasFormat('italic'));
      updateToolbarState('isUnderline', selection.hasFormat('underline'));
      updateToolbarState(
        'isStrikethrough',
        selection.hasFormat('strikethrough'),
      );
      updateToolbarState('isSubscript', selection.hasFormat('subscript'));
      updateToolbarState('isSuperscript', selection.hasFormat('superscript'));
      updateToolbarState('isHighlight', selection.hasFormat('highlight'));
      updateToolbarState('isCode', selection.hasFormat('code'));
      updateToolbarState(
        'fontSize',
        $getSelectionStyleValueForProperty(selection, 'font-size', '15px'),
      );
      updateToolbarState('isLowercase', selection.hasFormat('lowercase'));
      updateToolbarState('isUppercase', selection.hasFormat('uppercase'));
      updateToolbarState('isCapitalize', selection.hasFormat('capitalize'));
    }
    if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes();
      for (const selectedNode of nodes) {
        const parentList = $getNearestNodeOfType<ListNode>(
          selectedNode,
          ListNode,
        );
        if (parentList) {
          updateToolbarState('blockType', parentList.getListType());
        } else {
          const selectedElement = $findTopLevelElement(selectedNode);
          $handleHeadingNode(selectedElement);
          $handleCodeNode(selectedElement);
          if ($isElementNode(selectedElement)) {
            updateToolbarState(
              'elementFormat',
              selectedElement.getFormatType(),
            );
          }
        }
      }
    }
  }, [
    activeEditor,
    editor,
    updateToolbarState,
    $handleHeadingNode,
    $handleCodeNode,
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor);
        $updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar, setActiveEditor]);

  useEffect(() => {
    activeEditor.getEditorState().read(
      () => {
        $updateToolbar();
      },
      { editor: activeEditor },
    );
  }, [activeEditor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener(editable => setIsEditable(editable)),
      activeEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(
          () => {
            $updateToolbar();
          },
          { editor: activeEditor },
        );
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        payload => {
          updateToolbarState('canUndo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        payload => {
          updateToolbarState('canRedo', payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor, updateToolbarState]);

  // --- Callbacks ---

  const insertLink = useCallback(() => {
    if (!toolbarState.isLink) {
      setIsLinkEditMode(true);
      activeEditor.dispatchCommand(
        TOGGLE_LINK_COMMAND,
        sanitizeUrl('https://'),
      );
    } else {
      setIsLinkEditMode(false);
      activeEditor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [activeEditor, setIsLinkEditMode, toolbarState.isLink]);

  const onCodeLanguageSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) node.setLanguage(value);
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const onCodeThemeSelect = useCallback(
    (value: string) => {
      activeEditor.update(() => {
        if (selectedElementKey !== null) {
          const node = $getNodeByKey(selectedElementKey);
          if ($isCodeNode(node)) node.setTheme(value);
        }
      });
    },
    [activeEditor, selectedElementKey],
  );

  const insertGifOnClick = (payload: InsertImagePayload) => {
    activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  };

  const { showComments, toggleComments } = useComments();

  const canViewerSeeInsertDropdown = !toolbarState.isImageCaption;
  const canViewerSeeInsertCodeButton = !toolbarState.isImageCaption;

  // --- Build ToolbarItem[] from toolbar state ---

  const items = useMemo((): ToolbarItem[] => {
    const result: ToolbarItem[] = [];
    let order = 0;

    // ---- History group ----
    result.push({
      key: 'undo',
      type: 'button',
      order: order++,
      group: 'history',
      ariaLabel: 'Undo',
      title: IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)',
      icon: ReplyIcon,
      disabled: !toolbarState.canUndo || !isEditable,
      onClick: () => activeEditor.dispatchCommand(UNDO_COMMAND, undefined),
    });
    result.push({
      key: 'redo',
      type: 'button',
      order: order++,
      group: 'history',
      ariaLabel: 'Redo',
      title: IS_APPLE ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Y)',
      icon: HistoryIcon,
      disabled: !toolbarState.canRedo || !isEditable,
      onClick: () => activeEditor.dispatchCommand(REDO_COMMAND, undefined),
    });
    result.push({ key: 'divider-history', type: 'divider', order: order++ });

    // ---- Block format dropdown ----
    if (
      toolbarState.blockType in blockTypeToBlockName &&
      activeEditor === editor
    ) {
      const blockOptions: ToolbarDropdownOption[] = [
        {
          key: 'paragraph',
          label: 'Normal',
          shortcut: SHORTCUTS.NORMAL,
          isActive: toolbarState.blockType === 'paragraph',
          onClick: () => formatParagraph(activeEditor),
        },
        {
          key: 'h1',
          label: 'Heading 1',
          shortcut: SHORTCUTS.HEADING1,
          isActive: toolbarState.blockType === 'h1',
          onClick: () =>
            formatHeading(activeEditor, toolbarState.blockType, 'h1'),
        },
        {
          key: 'h2',
          label: 'Heading 2',
          shortcut: SHORTCUTS.HEADING2,
          isActive: toolbarState.blockType === 'h2',
          onClick: () =>
            formatHeading(activeEditor, toolbarState.blockType, 'h2'),
        },
        {
          key: 'h3',
          label: 'Heading 3',
          shortcut: SHORTCUTS.HEADING3,
          isActive: toolbarState.blockType === 'h3',
          onClick: () =>
            formatHeading(activeEditor, toolbarState.blockType, 'h3'),
        },
        {
          key: 'number',
          label: 'Numbered List',
          shortcut: SHORTCUTS.NUMBERED_LIST,
          isActive: toolbarState.blockType === 'number',
          onClick: () =>
            formatNumberedList(activeEditor, toolbarState.blockType),
          icon: ListOrderedIcon,
        },
        {
          key: 'bullet',
          label: 'Bullet List',
          shortcut: SHORTCUTS.BULLET_LIST,
          isActive: toolbarState.blockType === 'bullet',
          onClick: () => formatBulletList(activeEditor, toolbarState.blockType),
          icon: ListUnorderedIcon,
        },
        {
          key: 'check',
          label: 'Check List',
          shortcut: SHORTCUTS.CHECK_LIST,
          isActive: toolbarState.blockType === 'check',
          onClick: () => formatCheckList(activeEditor, toolbarState.blockType),
        },
        {
          key: 'quote',
          label: 'Quote',
          shortcut: SHORTCUTS.QUOTE,
          isActive: toolbarState.blockType === 'quote',
          onClick: () => formatQuote(activeEditor, toolbarState.blockType),
          icon: QuoteIcon,
        },
        {
          key: 'code',
          label: 'Code Block',
          shortcut: SHORTCUTS.CODE_BLOCK,
          isActive: toolbarState.blockType === 'code',
          onClick: () => formatCode(activeEditor, toolbarState.blockType),
          icon: CodeIcon,
        },
      ];

      result.push({
        key: 'block-format',
        type: 'dropdown',
        order: order++,
        group: 'block',
        ariaLabel: 'Formatting options for text style',
        label: blockTypeToBlockName[toolbarState.blockType],
        options: blockOptions,
        disabled: !isEditable,
      });
      result.push({ key: 'divider-block', type: 'divider', order: order++ });
    }

    // ---- Code block: language/theme dropdowns ----
    if (toolbarState.blockType === 'code' && isCodeHighlighted) {
      const langOptions = isCodeShiki
        ? CODE_LANGUAGE_OPTIONS_SHIKI_FALLBACK
        : CODE_LANGUAGE_OPTIONS_PRISM;
      result.push({
        key: 'code-language',
        type: 'dropdown',
        order: order++,
        group: 'code',
        ariaLabel: 'Select language',
        label: (langOptions.find(
          opt =>
            opt[0] ===
            (isCodeShiki
              ? normalizeCodeLanguageShiki(toolbarState.codeLanguage)
              : normalizeCodeLanguagePrism(toolbarState.codeLanguage)),
        ) || ['', ''])[1],
        disabled: !isEditable,
        options: langOptions.map(([value, name]) => ({
          key: value,
          label: name,
          isActive: value === toolbarState.codeLanguage,
          onClick: () => onCodeLanguageSelect(value),
        })),
      });

      if (isCodeShiki) {
        result.push({
          key: 'code-theme',
          type: 'dropdown',
          order: order++,
          group: 'code',
          ariaLabel: 'Select theme',
          label: (CODE_THEME_OPTIONS_SHIKI.find(
            opt => opt[0] === toolbarState.codeTheme,
          ) || ['', ''])[1],
          disabled: !isEditable,
          options: CODE_THEME_OPTIONS_SHIKI.map(([value, name]) => ({
            key: value,
            label: name,
            isActive: value === toolbarState.codeTheme,
            onClick: () => onCodeThemeSelect(value),
          })),
        });
      }
    } else {
      // ---- Font family dropdown ----
      result.push({
        key: 'font-family',
        type: 'dropdown',
        order: order++,
        group: 'font',
        ariaLabel: 'Font family',
        icon: TypographyIcon,
        label: toolbarState.fontFamily,
        disabled: !isEditable,
        options: FONT_FAMILY_OPTIONS.map(([value, name]) => ({
          key: value,
          label: name,
          isActive: toolbarState.fontFamily === value,
          onClick: () => {
            activeEditor.update(() => {
              const selection = $getSelection();
              if (selection !== null) {
                $patchStyleText(selection, { 'font-family': value });
              }
            });
          },
        })),
      });
      result.push({ key: 'divider-font', type: 'divider', order: order++ });

      // ---- Font size (custom control) ----
      result.push({
        key: 'font-size',
        type: 'custom',
        order: order++,
        group: 'font',
        render: () => (
          <FontSizeCustomItem
            editor={activeEditor}
            fontSize={toolbarState.fontSize}
            disabled={!isEditable}
          />
        ),
      });
      result.push({ key: 'divider-fontsize', type: 'divider', order: order++ });

      // ---- Inline format buttons ----
      result.push({
        key: 'bold',
        type: 'button',
        order: order++,
        group: 'format',
        ariaLabel: `Bold (${SHORTCUTS.BOLD})`,
        title: `Bold (${SHORTCUTS.BOLD})`,
        icon: BoldIcon,
        isActive: toolbarState.isBold,
        disabled: !isEditable,
        onClick: () =>
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
      });
      result.push({
        key: 'italic',
        type: 'button',
        order: order++,
        group: 'format',
        ariaLabel: `Italic (${SHORTCUTS.ITALIC})`,
        title: `Italic (${SHORTCUTS.ITALIC})`,
        icon: ItalicIcon,
        isActive: toolbarState.isItalic,
        disabled: !isEditable,
        onClick: () =>
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
      });
      result.push({
        key: 'underline',
        type: 'button',
        order: order++,
        group: 'format',
        ariaLabel: `Underline (${SHORTCUTS.UNDERLINE})`,
        title: `Underline (${SHORTCUTS.UNDERLINE})`,
        icon: UnderlineIcon,
        isActive: toolbarState.isUnderline,
        disabled: !isEditable,
        onClick: () =>
          activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),
      });

      if (canViewerSeeInsertCodeButton) {
        result.push({
          key: 'code-inline',
          type: 'button',
          order: order++,
          group: 'format',
          ariaLabel: `Code (${SHORTCUTS.INSERT_CODE_BLOCK})`,
          title: `Code (${SHORTCUTS.INSERT_CODE_BLOCK})`,
          icon: CodeIcon,
          isActive: toolbarState.isCode,
          disabled: !isEditable,
          onClick: () =>
            activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
        });
      }

      result.push({
        key: 'link',
        type: 'button',
        order: order++,
        group: 'format',
        ariaLabel: `Link (${SHORTCUTS.INSERT_LINK})`,
        title: `Link (${SHORTCUTS.INSERT_LINK})`,
        icon: LinkIcon,
        isActive: toolbarState.isLink,
        disabled: !isEditable,
        onClick: insertLink,
      });

      // ---- More formatting dropdown ----
      result.push({
        key: 'more-formatting',
        type: 'dropdown',
        order: order++,
        group: 'format',
        ariaLabel: 'More formatting options',
        icon: TriangleDownIcon,
        disabled: !isEditable,
        options: [
          {
            key: 'lowercase',
            label: 'Lowercase',
            shortcut: SHORTCUTS.LOWERCASE,
            isActive: toolbarState.isLowercase,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'lowercase'),
          },
          {
            key: 'uppercase',
            label: 'Uppercase',
            shortcut: SHORTCUTS.UPPERCASE,
            isActive: toolbarState.isUppercase,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'uppercase'),
          },
          {
            key: 'capitalize',
            label: 'Capitalize',
            shortcut: SHORTCUTS.CAPITALIZE,
            isActive: toolbarState.isCapitalize,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'capitalize'),
          },
          {
            key: 'strikethrough',
            label: 'Strikethrough',
            shortcut: SHORTCUTS.STRIKETHROUGH,
            isActive: toolbarState.isStrikethrough,
            icon: StrikethroughIcon,
            onClick: () =>
              activeEditor.dispatchCommand(
                FORMAT_TEXT_COMMAND,
                'strikethrough',
              ),
          },
          {
            key: 'subscript',
            label: 'Subscript',
            shortcut: SHORTCUTS.SUBSCRIPT,
            isActive: toolbarState.isSubscript,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript'),
          },
          {
            key: 'superscript',
            label: 'Superscript',
            shortcut: SHORTCUTS.SUPERSCRIPT,
            isActive: toolbarState.isSuperscript,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'superscript'),
          },
          {
            key: 'highlight',
            label: 'Highlight',
            isActive: toolbarState.isHighlight,
            icon: PaintbrushIcon,
            onClick: () =>
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight'),
          },
          {
            key: 'clear',
            label: 'Clear Formatting',
            shortcut: SHORTCUTS.CLEAR_FORMATTING,
            icon: XIcon,
            onClick: () => clearFormatting(activeEditor),
          },
        ],
      });

      // ---- Insert dropdown ----
      if (canViewerSeeInsertDropdown) {
        result.push({ key: 'divider-insert', type: 'divider', order: order++ });

        const insertOptions: ToolbarDropdownOption[] = [
          {
            key: 'hr',
            label: 'Horizontal Rule',
            icon: HorizontalRuleIcon,
            onClick: () =>
              activeEditor.dispatchCommand(
                INSERT_HORIZONTAL_RULE_COMMAND,
                undefined,
              ),
          },
          {
            key: 'table',
            label: 'Table',
            icon: TableIcon,
            onClick: () =>
              activeEditor.dispatchCommand(
                INSERT_TABLE_WITH_DIALOG_COMMAND,
                undefined,
              ),
          },
          {
            key: 'collapsible',
            label: 'Collapsible',
            icon: ChevronDownIcon,
            onClick: () =>
              activeEditor.dispatchCommand(
                INSERT_COLLAPSIBLE_COMMAND,
                undefined,
              ),
          },
          {
            key: 'excalidraw',
            label: 'Excalidraw',
            onClick: () =>
              activeEditor.dispatchCommand(
                INSERT_EXCALIDRAW_COMMAND,
                undefined,
              ),
          },
          {
            key: 'image',
            label: 'Image',
            icon: FileMediaIcon,
            onClick: () =>
              showModal('Insert Image', onClose => (
                <InsertImageDialog
                  activeEditor={activeEditor}
                  onClose={onClose}
                />
              )),
          },
          {
            key: 'gif',
            label: 'GIF',
            onClick: () =>
              insertGifOnClick({
                altText: 'Cat typing on a laptop',
                src: catTypingGif,
              }),
          },
          {
            key: 'equation',
            label: 'Equation',
            onClick: () =>
              showModal('Insert Equation', onClose => (
                <InsertEquationDialog
                  activeEditor={activeEditor}
                  onClose={onClose}
                />
              )),
          },
          ...EmbedConfigs.map(embedConfig => ({
            key: `embed-${embedConfig.type}`,
            label: embedConfig.contentName,
            onClick: () =>
              activeEditor.dispatchCommand(
                INSERT_EMBED_COMMAND,
                embedConfig.type,
              ),
          })),
        ];

        result.push({
          key: 'insert',
          type: 'dropdown',
          order: order++,
          group: 'insert',
          ariaLabel: 'Insert',
          icon: PlusIcon,
          label: 'Insert',
          disabled: !isEditable,
          options: insertOptions,
        });
      }
    }

    result.push({ key: 'divider-align', type: 'divider', order: order++ });

    // ---- Alignment dropdown ----
    const formatOption =
      ELEMENT_FORMAT_OPTIONS[toolbarState.elementFormat || 'left'];
    result.push({
      key: 'alignment',
      type: 'dropdown',
      order: order++,
      group: 'align',
      ariaLabel: 'Text alignment',
      label: formatOption.name,
      icon: RowsIcon,
      disabled: !isEditable,
      options: [
        {
          key: 'left',
          label: 'Left Align',
          shortcut: SHORTCUTS.LEFT_ALIGN,
          isActive: toolbarState.elementFormat === 'left',
          onClick: () =>
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left'),
        },
        {
          key: 'center',
          label: 'Center Align',
          shortcut: SHORTCUTS.CENTER_ALIGN,
          isActive: toolbarState.elementFormat === 'center',
          onClick: () =>
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center'),
        },
        {
          key: 'right',
          label: 'Right Align',
          shortcut: SHORTCUTS.RIGHT_ALIGN,
          isActive: toolbarState.elementFormat === 'right',
          onClick: () =>
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right'),
        },
        {
          key: 'justify',
          label: 'Justify Align',
          shortcut: SHORTCUTS.JUSTIFY_ALIGN,
          isActive: toolbarState.elementFormat === 'justify',
          onClick: () =>
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify'),
        },
        {
          key: 'outdent',
          label: 'Outdent',
          shortcut: SHORTCUTS.OUTDENT,
          onClick: () =>
            activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined),
        },
        {
          key: 'indent',
          label: 'Indent',
          shortcut: SHORTCUTS.INDENT,
          onClick: () =>
            activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined),
        },
      ],
    });

    result.push({ key: 'divider-comments', type: 'divider', order: order++ });

    // ---- Comments toggle ----
    result.push({
      key: 'comments',
      type: 'button',
      order: order++,
      group: 'comments',
      ariaLabel: showComments ? 'Hide Comments' : 'Show Comments',
      title: showComments ? 'Hide Comments' : 'Show Comments',
      icon: CommentIcon,
      isActive: showComments,
      onClick: toggleComments,
    });

    return result;
  }, [
    toolbarState,
    isEditable,
    isCodeHighlighted,
    isCodeShiki,
    activeEditor,
    editor,
    canViewerSeeInsertCodeButton,
    canViewerSeeInsertDropdown,
    showComments,
    toggleComments,
    insertLink,
    onCodeLanguageSelect,
    onCodeThemeSelect,
    showModal,
    selectedElementKey,
  ]);

  return (
    <>
      <Toolbar
        items={items}
        extraItems={extraItems}
        ariaLabel="Editor toolbar"
      />
      {modal}
    </>
  );
}

export default ToolbarPlugin;
