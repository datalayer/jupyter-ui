/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * ComponentPickerMenuPlugin - Slash command menu.
 *
 * Migrated from custom CSS icon classes to Primer Octicons
 * and Primer-styled popover container.
 */

import { $createCodeNode } from '@lexical/code';
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import { INSERT_EMBED_COMMAND } from '@lexical/react/LexicalAutoEmbedPlugin';
import {
  INSERT_JUPYTER_INPUT_OUTPUT_COMMAND,
  DEFAULT_INITIAL_OUTPUTS,
} from './JupyterInputOutputPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_HORIZONTAL_RULE_COMMAND } from '@lexical/react/LexicalHorizontalRuleNode';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { INSERT_COLLAPSIBLE_COMMAND } from './CollapsiblePlugin';
import { INSERT_EXCALIDRAW_COMMAND } from './ExcalidrawPlugin';
import { INSERT_TABLE_WITH_DIALOG_COMMAND } from './TablePlugin';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  FORMAT_ELEMENT_COMMAND,
  TextNode,
} from 'lexical';
import { useCallback, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { Kernel } from '@datalayer/jupyter-react';
import { Box, Text } from '@primer/react';
import {
  ChecklistIcon,
  ChevronDownIcon,
  CodeIcon,
  DashIcon,
  FileMediaIcon,
  HashIcon,
  ListOrderedIcon,
  ListUnorderedIcon,
  MoveToEndIcon,
  MoveToStartIcon,
  NoteIcon,
  PencilIcon,
  QuoteIcon,
  TableIcon,
  TypographyIcon,
} from '@primer/octicons-react';

import useModal from '../hooks/useModal';
import catTypingGif from '../images/yellow-flower-small.jpg';
import { EmbedConfigs } from './AutoEmbedPlugin';
import { InsertEquationDialog } from './EquationsPlugin';
import { INSERT_IMAGE_COMMAND, InsertImageDialog } from './ImagesPlugin';

class ComponentPickerOption extends MenuOption {
  title: string;
  icon?: JSX.Element;
  keywords: Array<string>;
  keyboardShortcut?: string;
  onSelect: (queryString: string) => void;
  disabled?: boolean;

  constructor(
    title: string,
    options: {
      icon?: JSX.Element;
      keywords?: Array<string>;
      keyboardShortcut?: string;
      onSelect: (queryString: string) => void;
      disabled?: boolean;
    },
  ) {
    super(title);
    this.title = title;
    this.keywords = options.keywords || [];
    this.icon = options.icon;
    this.keyboardShortcut = options.keyboardShortcut;
    this.onSelect = options.onSelect.bind(this);
    this.disabled = options.disabled || false;
  }
}

function ComponentPickerMenuItem({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: ComponentPickerOption;
}) {
  const handleClick = option.disabled ? undefined : onClick;
  const handleMouseEnter = option.disabled ? undefined : onMouseEnter;

  return (
    <Box
      as="li"
      key={option.key}
      tabIndex={-1}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected && !option.disabled}
      aria-disabled={option.disabled}
      id={'typeahead-item-' + index}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: '6px',
        borderRadius: 2,
        cursor: option.disabled ? 'not-allowed' : 'pointer',
        opacity: option.disabled ? 0.5 : 1,
        bg:
          isSelected && !option.disabled
            ? 'actionListItem.default.selectedBg'
            : 'transparent',
        color: 'fg.default',
        '&:hover': !option.disabled
          ? { bg: 'actionListItem.default.hoverBg' }
          : {},
        listStyle: 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'fg.muted',
          flexShrink: 0,
        }}
      >
        {option.icon}
      </Box>
      <Text sx={{ fontSize: 1 }}>{option.title}</Text>
    </Box>
  );
}

export interface ComponentPickerMenuPluginProps {
  kernel?: Kernel;
  initCode?: string;
}

export const ComponentPickerMenuPlugin = ({
  kernel,
  initCode = '',
}: ComponentPickerMenuPluginProps = {}): JSX.Element => {
  const [editor] = useLexicalComposerContext();
  const [modal, showModal] = useModal();
  const [queryString, setQueryString] = useState<string | null>(null);

  const checkForTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const getDynamicOptions = useCallback(() => {
    const options: Array<ComponentPickerOption> = [];

    if (queryString == null) {
      return options;
    }

    const fullTableRegex = new RegExp(/^([1-9]|10)x([1-9]|10)$/);
    const partialTableRegex = new RegExp(/^([1-9]|10)x?$/);

    const fullTableMatch = fullTableRegex.exec(queryString);
    const partialTableMatch = partialTableRegex.exec(queryString);

    if (fullTableMatch) {
      const [rows, columns] = fullTableMatch[0]
        .split('x')
        .map((n: string) => parseInt(n, 10));

      options.push(
        new ComponentPickerOption(`${rows}x${columns} Table`, {
          icon: <TableIcon size={16} />,
          keywords: ['table'],
          onSelect: () =>
            editor.dispatchCommand(INSERT_TABLE_WITH_DIALOG_COMMAND, undefined),
        }),
      );
    } else if (partialTableMatch) {
      const rows = parseInt(partialTableMatch[0], 10);

      options.push(
        ...Array.from({ length: 5 }, (_, i) => i + 1).map(
          columns =>
            new ComponentPickerOption(`${rows}x${columns} Table`, {
              icon: <TableIcon size={16} />,
              keywords: ['table'],
              onSelect: () =>
                editor.dispatchCommand(
                  INSERT_TABLE_WITH_DIALOG_COMMAND,
                  undefined,
                ),
            }),
        ),
      );
    }

    return options;
  }, [editor, queryString]);

  const options = useMemo(() => {
    const baseOptions = [
      new ComponentPickerOption('Jupyter Cell', {
        icon: <CodeIcon size={16} />,
        keywords: ['javascript', 'python', 'js', 'codeblock', 'jupyter'],
        onSelect: () => {
          editor.dispatchCommand(INSERT_JUPYTER_INPUT_OUTPUT_COMMAND, {
            code: initCode,
            outputs: DEFAULT_INITIAL_OUTPUTS,
            loading: 'Loading...',
          });
        },
      }),
      new ComponentPickerOption('Paragraph', {
        icon: <TypographyIcon size={16} />,
        keywords: ['normal', 'paragraph', 'p', 'text'],
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createParagraphNode());
            }
          }),
      }),
      ...Array.from({ length: 3 }, (_, i) => i + 1).map(
        n =>
          new ComponentPickerOption(`Heading ${n}`, {
            icon: <HashIcon size={16} />,
            keywords: ['heading', 'header', `h${n}`],
            onSelect: () =>
              editor.update(() => {
                const selection = $getSelection();
                if ($isRangeSelection(selection)) {
                  $setBlocksType(selection, () =>
                    // @ts-expect-error Correct types, but since they're dynamic TS doesn't like it.
                    $createHeadingNode(`h${n}`),
                  );
                }
              }),
          }),
      ),
      new ComponentPickerOption('Numbered List', {
        icon: <ListOrderedIcon size={16} />,
        keywords: ['numbered list', 'ordered list', 'ol'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Bulleted List', {
        icon: <ListUnorderedIcon size={16} />,
        keywords: ['bulleted list', 'unordered list', 'ul'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Check List', {
        icon: <ChecklistIcon size={16} />,
        keywords: ['check list', 'todo list'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined),
      }),
      new ComponentPickerOption('Table', {
        icon: <TableIcon size={16} />,
        keywords: ['table', 'grid', 'spreadsheet'],
        onSelect: () => {
          console.log(
            '[ComponentPicker] Table selected, dispatching INSERT_TABLE_WITH_DIALOG_COMMAND',
          );
          editor.dispatchCommand(INSERT_TABLE_WITH_DIALOG_COMMAND, undefined);
        },
      }),
      new ComponentPickerOption('Collapsible Container', {
        icon: <ChevronDownIcon size={16} />,
        keywords: [
          'collapsible',
          'collapse',
          'expand',
          'toggle',
          'accordion',
          'container',
        ],
        onSelect: () =>
          editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined),
      }),
      new ComponentPickerOption('Excalidraw', {
        icon: <PencilIcon size={16} />,
        keywords: [
          'excalidraw',
          'drawing',
          'diagram',
          'sketch',
          'whiteboard',
          'draw',
        ],
        onSelect: () =>
          editor.dispatchCommand(INSERT_EXCALIDRAW_COMMAND, undefined),
      }),
      new ComponentPickerOption('Quote', {
        icon: <QuoteIcon size={16} />,
        keywords: ['block quote'],
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $setBlocksType(selection, () => $createQuoteNode());
            }
          }),
      }),
      new ComponentPickerOption('Code', {
        icon: <CodeIcon size={16} />,
        keywords: ['javascript', 'python', 'js', 'codeblock'],
        onSelect: () =>
          editor.update(() => {
            const selection = $getSelection();

            if ($isRangeSelection(selection)) {
              if (selection.isCollapsed()) {
                $setBlocksType(selection, () => $createCodeNode());
              } else {
                const textContent = selection.getTextContent();
                const codeNode = $createCodeNode();
                selection.insertNodes([codeNode]);
                selection.insertRawText(textContent);
              }
            }
          }),
      }),
      new ComponentPickerOption('Divider', {
        icon: <DashIcon size={16} />,
        keywords: ['horizontal rule', 'divider', 'hr'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined),
      }),
      ...EmbedConfigs.map(
        embedConfig =>
          new ComponentPickerOption(`Embed ${embedConfig.contentName}`, {
            icon: embedConfig.icon,
            keywords: [...embedConfig.keywords, 'embed'],
            onSelect: () =>
              editor.dispatchCommand(INSERT_EMBED_COMMAND, embedConfig.type),
          }),
      ),
      new ComponentPickerOption('Equation', {
        icon: <NoteIcon size={16} />,
        keywords: ['equation', 'latex', 'math'],
        onSelect: () =>
          showModal('Insert Equation', onClose => (
            <InsertEquationDialog activeEditor={editor} onClose={onClose} />
          )),
      }),
      new ComponentPickerOption('GIF', {
        icon: <FileMediaIcon size={16} />,
        keywords: ['gif', 'animate', 'image', 'file'],
        onSelect: () =>
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            altText: 'Cat typing on a laptop',
            src: catTypingGif,
          }),
      }),
      new ComponentPickerOption('Image', {
        icon: <FileMediaIcon size={16} />,
        keywords: ['image', 'photo', 'picture', 'file'],
        onSelect: () =>
          showModal('Insert Image', onClose => (
            <InsertImageDialog activeEditor={editor} onClose={onClose} />
          )),
      }),
      ...(['left', 'center', 'right', 'justify'] as const).map(
        alignment =>
          new ComponentPickerOption(`Align ${alignment}`, {
            icon:
              alignment === 'left' ? (
                <MoveToStartIcon size={16} />
              ) : alignment === 'right' ? (
                <MoveToEndIcon size={16} />
              ) : (
                <DashIcon size={16} />
              ),
            keywords: ['align', 'justify', alignment],
            onSelect: () =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment),
          }),
      ),
    ];

    const dynamicOptions = getDynamicOptions();

    return queryString
      ? [
          ...dynamicOptions,
          ...baseOptions.filter(option => {
            return new RegExp(queryString, 'gi').exec(option.title) ||
              option.keywords != null
              ? option.keywords.some(keyword =>
                  new RegExp(queryString, 'gi').exec(keyword),
                )
              : false;
          }),
        ]
      : baseOptions;
  }, [editor, getDynamicOptions, queryString, showModal, kernel, initCode]);

  const onSelectOption = useCallback(
    (
      selectedOption: ComponentPickerOption,
      nodeToRemove: TextNode | null,
      closeMenu: () => void,
      matchingString: string,
    ) => {
      if (selectedOption.disabled) {
        return;
      }

      editor.update(() => {
        if (nodeToRemove) {
          nodeToRemove.remove();
        }
        selectedOption.onSelect(matchingString);
        closeMenu();
      });
    },
    [editor],
  );

  return (
    <>
      {modal}
      <LexicalTypeaheadMenuPlugin<ComponentPickerOption>
        onQueryChange={setQueryString}
        onSelectOption={onSelectOption}
        triggerFn={checkForTriggerMatch}
        options={options}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
        ) =>
          anchorElementRef.current && options.length
            ? ReactDOM.createPortal(
                <Box
                  sx={{
                    bg: 'canvas.overlay',
                    border: '1px solid',
                    borderColor: 'border.default',
                    borderRadius: 2,
                    boxShadow: 'shadow.large',
                    p: 1,
                    maxHeight: 300,
                    overflow: 'auto',
                    minWidth: 200,
                  }}
                >
                  <Box as="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
                    {options.map((option, i: number) => (
                      <ComponentPickerMenuItem
                        index={i}
                        isSelected={selectedIndex === i}
                        onClick={() => {
                          if (!option.disabled) {
                            setHighlightedIndex(i);
                            selectOptionAndCleanUp(option);
                          }
                        }}
                        onMouseEnter={() => {
                          if (!option.disabled) {
                            setHighlightedIndex(i);
                          }
                        }}
                        key={option.key}
                        option={option}
                      />
                    ))}
                  </Box>
                </Box>,
                anchorElementRef.current,
              )
            : null
        }
      />
    </>
  );
};

export default ComponentPickerMenuPlugin;
