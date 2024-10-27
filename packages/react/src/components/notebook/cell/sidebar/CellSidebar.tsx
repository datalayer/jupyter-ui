/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from '@primer/react';
import { ChevronRightIcon, XIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon } from '@primer/octicons-react';
import { ICellSidebarProps } from './CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';
import useNotebookStore from '../../NotebookState';

import { DATALAYER_CELL_SIDEBAR_CLASS_NAME } from './CellSidebarWidget';

export const CellSidebar = (props: ICellSidebarProps) => {
  const { notebookId, cellNodeId, nbgrader } = props;
  const [visible, setVisible] = useState(false);
  const notebookStore = useNotebookStore();
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
    return <div></div>;
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
      {nbgrader && (
        <ActionMenu>
          {/*
          <ActionMenu.Anchor>
            <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
          </ActionMenu.Anchor>
          <ActionMenu.Overlay>
          */}
          <CellMetadataEditor
            notebookId={notebookId}
            cell={activeCell}
            nbgrader={nbgrader}
          />
          {/*
            </ActionMenu.Overlay>
            */}
        </ActionMenu>
      )}
      <Box>
        <Button
          title="Run cell"
          leadingVisual={ChevronRightIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.run(notebookId);
          }}
        >
          Run
        </Button>
      </Box>
      <Box>
        <Button
          title="Insert code cell above"
          leadingVisual={ChevronUpIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
              notebookStore.insertAbove({
                id: notebookId,
                cellType: 'code',
              });
          }}
        >
          Code
        </Button>
      </Box>
      <Box>
        <Button
          title="Insert markdown cell above"
          leadingVisual={ChevronUpIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertAbove({
              id: notebookId,
              cellType: 'markdown',
            });
          }}
        >
          Markdown
        </Button>
      </Box>
      <Box>
        {activeCell.model.type === 'code' ? (
          <Button
            title="Convert to markdow cell"
            leadingVisual={SquareIcon}
            variant="invisible"
            size="small"
            onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({
                id: notebookId,
                cellType: 'markdown',
              });
            }}
          >
            To Markdown
          </Button>
        ) : (
          <Button
            title="Convert to code cell"
            leadingVisual={SquareIcon}
            variant="invisible"
            size="small"
            onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({
                id: notebookId,
                cellType: 'code',
              });
            }}
          >
            To Code
          </Button>
        )}
      </Box>
      <Box>
        <Button
          title="Insert markdown cell below"
          leadingVisual={ChevronDownIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({
              id: notebookId,
              cellType: 'markdown',
            });
          }}
        >
          Markdown
        </Button>
      </Box>
      <Box>
        <Button
          title="Insert code cell below"
          leadingVisual={ChevronDownIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({
              id: notebookId,
              cellType: 'code',
            });
          }}
        >
          Code
        </Button>
      </Box>
      <Box>
        <Button
          title="Delete cell"
          leadingVisual={XIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.delete(notebookId);
          }}
        >
          Delete
        </Button>
      </Box>
    </Box>
  ) : (
    <></>
  );
};

export default CellSidebar;
