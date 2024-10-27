/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { PanelLayout } from '@lumino/widgets';
import { Box, IconButton } from '@primer/react';
import { PlayIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon, XIcon } from '@primer/octicons-react';
import useNotebookStore from '../../NotebookState';
import { ICellSidebarProps } from './CellSidebarWidget';

import { DATALAYER_CELL_SIDEBAR_CLASS_NAME } from './CellSidebarWidget';

export const CellSidebarButton = (props: ICellSidebarProps) => {
  const { notebookId, cellNodeId } = props;
  const notebookStore = useNotebookStore();
  const [visible, setVisible] = useState(false);
  const activeCell = notebookStore.selectActiveCell(notebookId);
  const layout = activeCell?.layout;
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (cellWidget?.node.id === cellNodeId) {
      if (!visible) {
        setVisible(true);
      }
    }
    if (cellWidget?.node.id !== cellNodeId) {
      if (visible) {
        setVisible(false);
      }
    }
  }
  if (!visible) {
    return <></>
  }
  return activeCell ? (
    <Box
      className={DATALAYER_CELL_SIDEBAR_CLASS_NAME}
      sx={{
        '& p': {
          marginBottom: '0 !important',
        },
      }}
    >
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Run cell"
          title="Run cell"
          onClick={e => {
            e.preventDefault();
            notebookStore.run(notebookId);
          }}
          icon={PlayIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add code cell above"
          title="Add code cell above"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertAbove({
              id: notebookId,
              cellType: 'code',
            });
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add markdown cell above"
          title="Add markdown cell above"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertAbove({
              id: notebookId,
              cellType: 'markdown',
            });
          }}
          icon={ChevronUpIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        {activeCell.model.type === 'code' ? (
          <IconButton
            aria-label="Convert to markdow cell"
            title="Convert to markdow cell"
            icon={SquareIcon}
            size="small"
            variant="invisible"
            onClick={e => {
              e.preventDefault();
              notebookStore.changeCellType({
                id: notebookId,
                cellType: 'markdown',
              });
            }}
          />
        ) : (
          <IconButton
            aria-label="Convert to code cell"
            title="Convert to code cell"
            icon={SquareIcon}
            variant="invisible"
            size="small"
            onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({
                id: notebookId,
                cellType: 'code',
              });
            }}
          />
        )}
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add markdown cell below"
          title="Add markdown cell below"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertBelow({
              id: notebookId,
              cellType: 'markdown',
            });
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="secondary"
          aria-label="Add code cell above"
          title="Add code cell above"
          onClick={e => {
            e.preventDefault();
            notebookStore.insertBelow({
              id: notebookId,
              cellType: 'code',
            });
          }}
          icon={ChevronDownIcon}
          variant="invisible"
        />
      </Box>
      <Box>
        <IconButton
          size="small"
          color="error"
          aria-label="Delete cell"
          title="Delete cell"
          onClick={e => {
            e.preventDefault();
            notebookStore.delete(notebookId);
          }}
          icon={XIcon}
          variant="invisible"
        />
      </Box>
    </Box>
  ) : (
    <></>
  );
};

export default CellSidebarButton;
