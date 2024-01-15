/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from '@primer/react';
import {
  ChevronRightIcon,
  XIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SquareIcon,
} from '@primer/octicons-react';
import { notebookActions, selectActiveCell } from '../../NotebookRedux';
import { CellSidebarProps } from './CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';

import { DATALAYER_CELL_HEADER_CLASS } from './CellSidebarWidget';

export const CellSidebar = (props: CellSidebarProps) => {
  const { notebookId, cellId, nbgrader } = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const activeCell = selectActiveCell(notebookId);
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
          title="Run cell"
          leadingVisual={ChevronRightIcon}
          variant="invisible"
          size="small"
          onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.run.started(notebookId));
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
            dispatch(
              notebookActions.insertAbove.started({
                uid: notebookId,
                cellType: 'code',
              }),
            );
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
            dispatch(
              notebookActions.insertAbove.started({
                uid: notebookId,
                cellType: 'markdown',
              }),
            );
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
              dispatch(
                notebookActions.changeCellType.started({
                  uid: notebookId,
                  cellType: 'markdown',
                }),
              );
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
              dispatch(
                notebookActions.changeCellType.started({
                  uid: notebookId,
                  cellType: 'code',
                }),
              );
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
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: 'markdown',
              }),
            );
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
            dispatch(
              notebookActions.insertBelow.started({
                uid: notebookId,
                cellType: 'code',
              }),
            );
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
            dispatch(notebookActions.delete.started(notebookId));
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

export default CellSidebar;
