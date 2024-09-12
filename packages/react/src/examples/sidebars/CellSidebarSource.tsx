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
import { ICellSidebarProps } from '../../components/notebook/cell/sidebar/CellSidebarWidget';
import CellMetadataEditor from '../../components/notebook/cell/metadata/CellMetadataEditor';
import useNotebookStore from '../../components/notebook/NotebookState';

import { DATALAYER_CELL_HEADER_CLASS } from '../../components/notebook/cell/sidebar/CellSidebarWidget';

export const CellSidebarSource = (props: ICellSidebarProps) => {
  const { notebookId, cellId, nbgrader } = props;
  const notebookStore = useNotebookStore();
  const [visible, setVisible] = useState(false);
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
      <span style={{ display: 'flex' }}>
        <Button
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
          leadingVisual={ChevronUpIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertAbove({
              id: notebookId,
              cellType: 'code',
              source:
                "print('Hello 🪐 ⚛️ Jupyter React, I have been inserted up ⬆️.')",
            });
          }}
        >
          Code (with source)
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
        <Button
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
      </span>
      <span style={{ display: 'flex' }}>
        {activeCell.model.type === 'code' ? (
          <Button
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
      </span>
      <span style={{ display: 'flex' }}>
        <Button
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
      </span>
      <span style={{ display: 'flex' }}>
        <Button
          leadingVisual={ChevronDownIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({
              id: notebookId,
              cellType: 'code',
              source:
                "print('Hello 🪐 ⚛️ Jupyter React, I have been inserted down ⬇️.')",
            })
          }}
        >
          Code (with source)
        </Button>
      </span>
      <span style={{ display: 'flex' }}>
        <Button
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
    </Box>
  ) : (
    <></>
  );
};

export default CellSidebarSource;
