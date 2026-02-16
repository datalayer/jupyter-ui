/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { ElementNode, LexicalEditor } from 'lexical';
import type { JSX } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import {
  $computeTableMapSkipCellCheck,
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $getNodeTriplet,
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  $isTableCellNode,
  $isTableSelection,
  $mergeCells,
  $unmergeCell,
  getTableElement,
  getTableObserverFromTableElement,
  TableCellHeaderStates,
  TableCellNode,
  TableObserver,
  TableSelection,
} from '@lexical/table';
import { mergeRegister } from '@lexical/utils';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  getDOMSelection,
  isDOMNode,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { ReactPortal, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ActionList, Box, IconButton } from '@primer/react';
import {
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DashIcon,
} from '@primer/octicons-react';

import useModal from '../../hooks/useModal';
import ColorPicker from '../../components/ColorPicker';

function computeSelectionCount(selection: TableSelection): {
  columns: number;
  rows: number;
} {
  const selectionShape = selection.getShape();
  return {
    columns: selectionShape.toX - selectionShape.fromX + 1,
    rows: selectionShape.toY - selectionShape.fromY + 1,
  };
}

function $canUnmerge(): boolean {
  const selection = $getSelection();
  if (
    ($isRangeSelection(selection) && !selection.isCollapsed()) ||
    ($isTableSelection(selection) && !selection.anchor.is(selection.focus)) ||
    (!$isRangeSelection(selection) && !$isTableSelection(selection))
  ) {
    return false;
  }
  const [cell] = $getNodeTriplet(selection.anchor);
  return cell.__colSpan > 1 || cell.__rowSpan > 1;
}

function $selectLastDescendant(node: ElementNode): void {
  const lastDescendant = node.getLastDescendant();
  if ($isTextNode(lastDescendant)) {
    lastDescendant.select();
  } else if ($isElementNode(lastDescendant)) {
    lastDescendant.selectEnd();
  } else if (lastDescendant !== null) {
    lastDescendant.selectNext();
  }
}

function currentCellBackgroundColor(editor: LexicalEditor): null | string {
  return editor.getEditorState().read(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const [cell] = $getNodeTriplet(selection.anchor);
      if ($isTableCellNode(cell)) {
        return cell.getBackgroundColor();
      }
    }
    return null;
  });
}

type TableCellActionMenuProps = Readonly<{
  contextRef: { current: null | HTMLElement };
  onClose: () => void;
  setIsMenuOpen: (isOpen: boolean) => void;
  showColorPickerModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void;
  tableCellNode: TableCellNode;
  cellMerge: boolean;
}>;

function TableActionMenu({
  onClose,
  tableCellNode: _tableCellNode,
  setIsMenuOpen,
  contextRef,
  cellMerge,
  showColorPickerModal,
}: TableCellActionMenuProps) {
  const [editor] = useLexicalComposerContext();
  const dropDownRef = useRef<HTMLDivElement | null>(null);
  const [tableCellNode, updateTableCellNode] = useState(_tableCellNode);
  const [selectionCounts, updateSelectionCounts] = useState({
    columns: 1,
    rows: 1,
  });
  const [canMergeCells, setCanMergeCells] = useState(false);
  const [canUnmergeCell, setCanUnmergeCell] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(
    () => currentCellBackgroundColor(editor) || '',
  );

  useEffect(() => {
    return editor.registerMutationListener(
      TableCellNode,
      nodeMutations => {
        const nodeUpdated =
          nodeMutations.get(tableCellNode.getKey()) === 'updated';

        if (nodeUpdated) {
          editor.getEditorState().read(() => {
            updateTableCellNode(tableCellNode.getLatest());
          });
          setBackgroundColor(currentCellBackgroundColor(editor) || '');
        }
      },
      { skipInitialization: true },
    );
  }, [editor, tableCellNode]);

  useEffect(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      // Merge cells
      if ($isTableSelection(selection)) {
        const currentSelectionCounts = computeSelectionCount(selection);
        updateSelectionCounts(computeSelectionCount(selection));
        setCanMergeCells(
          currentSelectionCounts.columns > 1 || currentSelectionCounts.rows > 1,
        );
      }
      // Unmerge cell
      setCanUnmergeCell($canUnmerge());
    });
  }, [editor]);

  useEffect(() => {
    const menuButtonElement = contextRef.current;
    const dropDownElement = dropDownRef.current;
    const rootElement = editor.getRootElement();

    if (
      menuButtonElement != null &&
      dropDownElement != null &&
      rootElement != null
    ) {
      const rootEleRect = rootElement.getBoundingClientRect();
      const menuButtonRect = menuButtonElement.getBoundingClientRect();
      dropDownElement.style.opacity = '1';
      const dropDownElementRect = dropDownElement.getBoundingClientRect();
      const margin = 5;
      let leftPosition = menuButtonRect.right + margin;
      if (
        leftPosition + dropDownElementRect.width > window.innerWidth ||
        leftPosition + dropDownElementRect.width > rootEleRect.right
      ) {
        const position =
          menuButtonRect.left - dropDownElementRect.width - margin;
        leftPosition = (position < 0 ? margin : position) + window.pageXOffset;
      }
      dropDownElement.style.left = `${leftPosition + window.pageXOffset}px`;

      let topPosition = menuButtonRect.top;
      if (topPosition + dropDownElementRect.height > window.innerHeight) {
        const position = menuButtonRect.bottom - dropDownElementRect.height;
        topPosition = position < 0 ? margin : position;
      }
      dropDownElement.style.top = `${topPosition}px`;
    }
  }, [contextRef, dropDownRef, editor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropDownRef.current != null &&
        contextRef.current != null &&
        isDOMNode(event.target) &&
        !dropDownRef.current.contains(event.target) &&
        !contextRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener('click', handleClickOutside);

    return () => window.removeEventListener('click', handleClickOutside);
  }, [setIsMenuOpen, contextRef]);

  const clearTableSelection = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const tableElement = getTableElement(
          tableNode,
          editor.getElementByKey(tableNode.getKey()),
        );

        if (tableElement === null) {
          throw new Error(
            'TableActionMenu: Expected to find tableElement in DOM',
          );
        }

        const tableObserver = getTableObserverFromTableElement(tableElement);
        if (tableObserver !== null) {
          tableObserver.$clearHighlight();
        }

        tableNode.markDirty();
        updateTableCellNode(tableCellNode.getLatest());
      }
      $setSelection(null);
    });
  }, [editor, tableCellNode]);

  const mergeTableCellsAtSelection = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isTableSelection(selection)) {
        return;
      }

      const nodes = selection.getNodes();
      const tableCells = nodes.filter($isTableCellNode);
      const targetCell = $mergeCells(tableCells);

      if (targetCell) {
        $selectLastDescendant(targetCell);
        onClose();
      }
    });
  };

  const unmergeTableCellsAtSelection = () => {
    editor.update(() => {
      $unmergeCell();
    });
  };

  const insertTableRowAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.rows; i++) {
          $insertTableRowAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.rows],
  );

  const insertTableColumnAtSelection = useCallback(
    (shouldInsertAfter: boolean) => {
      editor.update(() => {
        for (let i = 0; i < selectionCounts.columns; i++) {
          $insertTableColumnAtSelection(shouldInsertAfter);
        }
        onClose();
      });
    },
    [editor, onClose, selectionCounts.columns],
  );

  const deleteTableRowAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableRowAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const deleteTableAtSelection = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
      tableNode.remove();

      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const deleteTableColumnAtSelection = useCallback(() => {
    editor.update(() => {
      $deleteTableColumnAtSelection();
      onClose();
    });
  }, [editor, onClose]);

  const toggleTableRowIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableRowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);

      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);

      const rowCells = new Set<TableCellNode>();

      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.ROW;

      for (let col = 0; col < gridMap[tableRowIndex].length; col++) {
        const mapCell = gridMap[tableRowIndex][col];

        if (!mapCell?.cell) {
          continue;
        }

        if (!rowCells.has(mapCell.cell)) {
          rowCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.ROW);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleTableColumnIsHeader = useCallback(() => {
    editor.update(() => {
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);

      const tableColumnIndex =
        $getTableColumnIndexFromTableCellNode(tableCellNode);

      const [gridMap] = $computeTableMapSkipCellCheck(tableNode, null, null);

      const columnCells = new Set<TableCellNode>();
      const newStyle =
        tableCellNode.getHeaderStyles() ^ TableCellHeaderStates.COLUMN;

      for (let row = 0; row < gridMap.length; row++) {
        const mapCell = gridMap[row][tableColumnIndex];

        if (!mapCell?.cell) {
          continue;
        }

        if (!columnCells.has(mapCell.cell)) {
          columnCells.add(mapCell.cell);
          mapCell.cell.setHeaderStyles(newStyle, TableCellHeaderStates.COLUMN);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleRowStriping = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setRowStriping(!tableNode.getRowStriping());
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleFirstRowFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenRows(tableNode.getFrozenRows() === 0 ? 1 : 0);
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const toggleFirstColumnFreeze = useCallback(() => {
    editor.update(() => {
      if (tableCellNode.isAttached()) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        if (tableNode) {
          tableNode.setFrozenColumns(
            tableNode.getFrozenColumns() === 0 ? 1 : 0,
          );
        }
      }
      clearTableSelection();
      onClose();
    });
  }, [editor, tableCellNode, clearTableSelection, onClose]);

  const handleCellBackgroundColor = useCallback(
    (value: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          const [cell] = $getNodeTriplet(selection.anchor);
          if ($isTableCellNode(cell)) {
            cell.setBackgroundColor(value);
          }

          if ($isTableSelection(selection)) {
            const nodes = selection.getNodes();

            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if ($isTableCellNode(node)) {
                node.setBackgroundColor(value);
              }
            }
          }
        }
      });
    },
    [editor],
  );

  const formatVerticalAlign = (value: string) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) || $isTableSelection(selection)) {
        const [cell] = $getNodeTriplet(selection.anchor);
        if ($isTableCellNode(cell)) {
          cell.setVerticalAlign(value);
        }

        if ($isTableSelection(selection)) {
          const nodes = selection.getNodes();

          for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if ($isTableCellNode(node)) {
              node.setVerticalAlign(value);
            }
          }
        }
      }
    });
  };

  let mergeCellButton: null | JSX.Element = null;
  if (cellMerge) {
    if (canMergeCells) {
      mergeCellButton = (
        <ActionList.Item
          onSelect={() => mergeTableCellsAtSelection()}
          data-test-id="table-merge-cells"
        >
          Merge cells
        </ActionList.Item>
      );
    } else if (canUnmergeCell) {
      mergeCellButton = (
        <ActionList.Item
          onSelect={() => unmergeTableCellsAtSelection()}
          data-test-id="table-unmerge-cells"
        >
          Unmerge cells
        </ActionList.Item>
      );
    }
  }

  return createPortal(
    <Box
      ref={dropDownRef}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
      }}
      sx={{
        position: 'fixed',
        zIndex: 10,
        opacity: 0,
        bg: 'canvas.overlay',
        border: '1px solid',
        borderColor: 'border.default',
        borderRadius: 2,
        boxShadow: 'shadow.large',
        minWidth: 200,
        py: 1,
      }}
    >
      <ActionList>
        {mergeCellButton}
        <ActionList.Item
          onSelect={() =>
            showColorPickerModal('Cell background color', () => (
              <ColorPicker
                color={backgroundColor}
                onChange={handleCellBackgroundColor}
              />
            ))
          }
          data-test-id="table-background-color"
        >
          Background color
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => toggleRowStriping()}
          data-test-id="table-row-striping"
        >
          Toggle Row Striping
        </ActionList.Item>
        <ActionList.Group title="Vertical Align">
          <ActionList.Item onSelect={() => formatVerticalAlign('top')}>
            <ActionList.LeadingVisual>
              <ArrowUpIcon />
            </ActionList.LeadingVisual>
            Top Align
          </ActionList.Item>
          <ActionList.Item onSelect={() => formatVerticalAlign('middle')}>
            <ActionList.LeadingVisual>
              <DashIcon />
            </ActionList.LeadingVisual>
            Middle Align
          </ActionList.Item>
          <ActionList.Item onSelect={() => formatVerticalAlign('bottom')}>
            <ActionList.LeadingVisual>
              <ArrowDownIcon />
            </ActionList.LeadingVisual>
            Bottom Align
          </ActionList.Item>
        </ActionList.Group>
        <ActionList.Item
          onSelect={() => toggleFirstRowFreeze()}
          data-test-id="table-freeze-first-row"
        >
          Toggle First Row Freeze
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => toggleFirstColumnFreeze()}
          data-test-id="table-freeze-first-column"
        >
          Toggle First Column Freeze
        </ActionList.Item>
        <ActionList.Divider />
        <ActionList.Item
          onSelect={() => insertTableRowAtSelection(false)}
          data-test-id="table-insert-row-above"
        >
          Insert{' '}
          {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`}{' '}
          above
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => insertTableRowAtSelection(true)}
          data-test-id="table-insert-row-below"
        >
          Insert{' '}
          {selectionCounts.rows === 1 ? 'row' : `${selectionCounts.rows} rows`}{' '}
          below
        </ActionList.Item>
        <ActionList.Divider />
        <ActionList.Item
          onSelect={() => insertTableColumnAtSelection(false)}
          data-test-id="table-insert-column-before"
        >
          Insert{' '}
          {selectionCounts.columns === 1
            ? 'column'
            : `${selectionCounts.columns} columns`}{' '}
          left
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => insertTableColumnAtSelection(true)}
          data-test-id="table-insert-column-after"
        >
          Insert{' '}
          {selectionCounts.columns === 1
            ? 'column'
            : `${selectionCounts.columns} columns`}{' '}
          right
        </ActionList.Item>
        <ActionList.Divider />
        <ActionList.Item
          onSelect={() => deleteTableColumnAtSelection()}
          data-test-id="table-delete-columns"
          variant="danger"
        >
          Delete column
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => deleteTableRowAtSelection()}
          data-test-id="table-delete-rows"
          variant="danger"
        >
          Delete row
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => deleteTableAtSelection()}
          data-test-id="table-delete"
          variant="danger"
        >
          Delete table
        </ActionList.Item>
        <ActionList.Divider />
        <ActionList.Item
          onSelect={() => toggleTableRowIsHeader()}
          data-test-id="table-row-header"
        >
          {(tableCellNode.__headerState & TableCellHeaderStates.ROW) ===
          TableCellHeaderStates.ROW
            ? 'Remove'
            : 'Add'}{' '}
          row header
        </ActionList.Item>
        <ActionList.Item
          onSelect={() => toggleTableColumnIsHeader()}
          data-test-id="table-column-header"
        >
          {(tableCellNode.__headerState & TableCellHeaderStates.COLUMN) ===
          TableCellHeaderStates.COLUMN
            ? 'Remove'
            : 'Add'}{' '}
          column header
        </ActionList.Item>
      </ActionList>
    </Box>,
    document.body,
  );
}

function TableCellActionMenuContainer({
  anchorElem,
  cellMerge,
}: {
  anchorElem: HTMLElement;
  cellMerge: boolean;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();

  const menuButtonRef = useRef<HTMLDivElement | null>(null);
  const menuRootRef = useRef<HTMLButtonElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [tableCellNode, setTableMenuCellNode] = useState<TableCellNode | null>(
    null,
  );

  const [colorPickerModal, showColorPickerModal] = useModal();

  const checkTableCellOverflow = useCallback(
    (tableCellParentNodeDOM: HTMLElement): boolean => {
      const scrollableContainer = tableCellParentNodeDOM.closest(
        '.PlaygroundEditorTheme__tableScrollableWrapper',
      );
      if (scrollableContainer) {
        const containerRect = (
          scrollableContainer as HTMLElement
        ).getBoundingClientRect();
        const cellRect = tableCellParentNodeDOM.getBoundingClientRect();

        // Calculate where the action button would be positioned (5px from right edge of cell)
        // Also account for the button width and table cell padding (8px)
        const actionButtonRight = cellRect.right - 5;
        const actionButtonLeft = actionButtonRight - 28; // 20px width + 8px padding

        // Only hide if the action button would overflow the container
        if (
          actionButtonRight > containerRect.right ||
          actionButtonLeft < containerRect.left
        ) {
          return true;
        }
      }
      return false;
    },
    [],
  );

  const $moveMenu = useCallback(() => {
    const menu = menuButtonRef.current;
    const selection = $getSelection();
    const nativeSelection = getDOMSelection(editor._window);
    const activeElement = document.activeElement;
    function disable() {
      if (menu) {
        menu.classList.remove(
          'PlaygroundEditorTheme__tableCellActionButtonContainer--active',
        );
        menu.classList.add(
          'PlaygroundEditorTheme__tableCellActionButtonContainer--inactive',
        );
      }
      setTableMenuCellNode(null);
    }

    if (selection == null || menu == null) {
      return disable();
    }

    const rootElement = editor.getRootElement();
    let tableObserver: TableObserver | null = null;
    let tableCellParentNodeDOM: HTMLElement | null = null;

    if (
      $isRangeSelection(selection) &&
      rootElement !== null &&
      nativeSelection !== null &&
      rootElement.contains(nativeSelection.anchorNode)
    ) {
      const tableCellNodeFromSelection = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );

      if (tableCellNodeFromSelection == null) {
        return disable();
      }

      tableCellParentNodeDOM = editor.getElementByKey(
        tableCellNodeFromSelection.getKey(),
      );

      if (
        tableCellParentNodeDOM == null ||
        !tableCellNodeFromSelection.isAttached()
      ) {
        return disable();
      }

      if (checkTableCellOverflow(tableCellParentNodeDOM)) {
        return disable();
      }

      const tableNode = $getTableNodeFromLexicalNodeOrThrow(
        tableCellNodeFromSelection,
      );
      const tableElement = getTableElement(
        tableNode,
        editor.getElementByKey(tableNode.getKey()),
      );

      if (tableElement === null) {
        throw new Error(
          'TableActionMenu: Expected to find tableElement in DOM',
        );
      }

      tableObserver = getTableObserverFromTableElement(tableElement);
      setTableMenuCellNode(tableCellNodeFromSelection);
    } else if ($isTableSelection(selection)) {
      const anchorNode = $getTableCellNodeFromLexicalNode(
        selection.anchor.getNode(),
      );
      if (!$isTableCellNode(anchorNode)) {
        throw new Error('TableSelection anchorNode must be a TableCellNode');
      }
      const tableNode = $getTableNodeFromLexicalNodeOrThrow(anchorNode);
      const tableElement = getTableElement(
        tableNode,
        editor.getElementByKey(tableNode.getKey()),
      );
      if (tableElement === null) {
        throw new Error(
          'TableActionMenu: Expected to find tableElement in DOM',
        );
      }
      tableObserver = getTableObserverFromTableElement(tableElement);
      tableCellParentNodeDOM = editor.getElementByKey(anchorNode.getKey());

      if (tableCellParentNodeDOM === null) {
        return disable();
      }

      if (checkTableCellOverflow(tableCellParentNodeDOM)) {
        return disable();
      }
    } else if (!activeElement) {
      return disable();
    }
    if (tableObserver === null || tableCellParentNodeDOM === null) {
      return disable();
    }
    const enabled = !tableObserver || !tableObserver.isSelecting;
    menu.classList.toggle(
      'PlaygroundEditorTheme__tableCellActionButtonContainer--active',
      enabled,
    );
    menu.classList.toggle(
      'PlaygroundEditorTheme__tableCellActionButtonContainer--inactive',
      !enabled,
    );
    if (enabled) {
      const tableCellRect = tableCellParentNodeDOM.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = tableCellRect.top - anchorRect.top + 6; // 6px from top edge
      const left = tableCellRect.right - anchorRect.left - 29; // 24px button + 5px padding from right edge
      menu.style.transform = `translate(${left}px, ${top}px)`;
    }
  }, [editor, anchorElem, checkTableCellOverflow]);

  useEffect(() => {
    // We call the $moveMenu callback every time the selection changes,
    // once up front, and once after each pointerUp
    let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;
    const callback = () => {
      timeoutId = undefined;
      editor.getEditorState().read($moveMenu);
    };
    const delayedCallback = () => {
      if (timeoutId === undefined) {
        timeoutId = setTimeout(callback, 0);
      }
      return false;
    };

    // Update position on scroll - catch all scroll events
    const handleScroll = () => {
      delayedCallback();
    };

    // Add scroll listeners to document and window to catch all scrolls
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('scroll', handleScroll, true);

    const cleanup = mergeRegister(
      editor.registerUpdateListener(delayedCallback),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        delayedCallback,
        COMMAND_PRIORITY_CRITICAL,
      ),
      editor.registerRootListener((rootElement, prevRootElement) => {
        if (prevRootElement) {
          prevRootElement.removeEventListener('pointerup', delayedCallback);
        }
        if (rootElement) {
          rootElement.addEventListener('pointerup', delayedCallback);
          delayedCallback();
        }
      }),
      () => {
        clearTimeout(timeoutId);
        document.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('scroll', handleScroll, true);
      },
    );

    return cleanup;
  });

  const prevTableCellDOM = useRef(tableCellNode);

  useEffect(() => {
    if (prevTableCellDOM.current !== tableCellNode) {
      setIsMenuOpen(false);
    }

    prevTableCellDOM.current = tableCellNode;
  }, [prevTableCellDOM, tableCellNode]);

  return (
    <div
      className="PlaygroundEditorTheme__tableCellActionButtonContainer"
      ref={menuButtonRef}
    >
      {tableCellNode != null && (
        <>
          <IconButton
            icon={ChevronDownIcon}
            aria-label="Table cell menu"
            variant="invisible"
            size="small"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            ref={menuRootRef as any}
          />
          {colorPickerModal}
          {isMenuOpen && (
            <TableActionMenu
              contextRef={menuRootRef}
              setIsMenuOpen={setIsMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              tableCellNode={tableCellNode}
              cellMerge={cellMerge}
              showColorPickerModal={showColorPickerModal}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function TableActionMenuPlugin({
  anchorElem = document.body,
  cellMerge = false,
}: {
  anchorElem?: HTMLElement;
  cellMerge?: boolean;
}): null | ReactPortal {
  const isEditable = useLexicalEditable();
  return createPortal(
    isEditable ? (
      <TableCellActionMenuContainer
        anchorElem={anchorElem}
        cellMerge={cellMerge}
      />
    ) : null,
    anchorElem,
  );
}
