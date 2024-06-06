/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from '@primer/react';
import {
  ChevronRightIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SquareIcon,
} from '@primer/octicons-react';
import { CellSidebarProps } from './CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';
import useNotebookStore from '../../NotebookState';

import { DATALAYER_CELL_HEADER_CLASS } from './CellSidebarWidget';

export const CellSidebar = (props: CellSidebarProps) => {
  const { notebookId, cellId, nbgrader } = props;
  const [visible, setVisible] = useState(false);
  const notebookStore = useNotebookStore()
  const activeCell = notebookStore.selectActiveCell(notebookId);
  const layout = activeCell?.layout;
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (cellWidget?.node.id === cellId) {
      if (!visible) {
        setVisible(true);
      }
    }
    if (cellWidget?.node.id !== cellId) {
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
      className={DATALAYER_CELL_HEADER_CLASS}
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
      <span style={{ display: 'flex' }}>
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
      </span>
      <span style={{ display: 'flex' }}>
        <Button
          title="Insert code cell above"
          leadingVisual={ChevronUpIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
              notebookStore.insertAbove({
                uid: notebookId,
                cellType: 'code',
              });
          }}
        >
          Code
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
        <Button
          title="Insert markdown cell above"
          leadingVisual={ChevronUpIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertAbove({
              uid: notebookId,
              cellType: 'markdown',
            });
          }}
        >
          Markdown
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
        {activeCell.model.type === 'code' ? (
          <Button
            title="Convert to markdow cell"
            leadingVisual={SquareIcon}
            variant="invisible"
            size="small"
            onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({
                uid: notebookId,
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
                uid: notebookId,
                cellType: 'code',
              });
            }}
          >
            To Code
          </Button>
        )}
      </span>
      <span style={{ display: 'flex' }}>
        <Button
          title="Insert markdown cell below"
          leadingVisual={ChevronDownIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({
              uid: notebookId,
              cellType: 'markdown',
            });
          }}
        >
          Markdown
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
        <Button
          title="Insert code cell below"
          leadingVisual={ChevronDownIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({
              uid: notebookId,
              cellType: 'code',
            });
          }}
        >
          Code
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
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
      </span>
    </Box>
  ) : (
    <></>
  );
};

export default CellSidebar;
