/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, Box } from "@primer/react";
import { ChevronRightIcon, XIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon } from "@primer/octicons-react";
import { useNotebookStore, ICellSidebarProps, CellMetadataEditor, DATALAYER_CELL_SIDEBAR_CLASS_NAME } from '@datalayer/jupyter-react';

export const CellSidebar = (props: ICellSidebarProps) => {
  const [visible, setVisible] = useState(false);
  const { notebookId, cellNodeId, nbgrader } = props;
  const notebookStore = useNotebookStore();
  const activeCell = notebookStore.selectActiveCell(notebookId);
  const layout = (activeCell?.layout);
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (!visible && (cellWidget?.node.id === cellNodeId)) {
      setVisible(true);
    }
    if (visible && (cellWidget?.node.id !== cellNodeId)) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>
  }
  return (
    activeCell ? 
      <Box
        className={DATALAYER_CELL_SIDEBAR_CLASS_NAME}
        sx={{
          '& p': {
            marginBottom: '0 !important',
          }
        }}
      >
        <span style={{ display: "flex" }}>
          <Button leadingVisual={ChevronRightIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.run(notebookId);
          }}>
            Run
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingVisual={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertAbove({ id: notebookId, cellType: "code" });
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingVisual={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertAbove({ id: notebookId, cellType: "markdown" });
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
        { activeCell.model.type === "code" ?
            <Button leadingVisual={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({ id: notebookId, cellType: "markdown" });
            }}>
              To Mardown
            </Button>
          :
            <Button leadingVisual={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              notebookStore.changeCellType({ id: notebookId, cellType: "code" });
            }}>
              To Code
            </Button>
        }
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingVisual={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({ id: notebookId, cellType: "markdown" });
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingVisual={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.insertBelow({ id: notebookId, cellType: "code" });
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingVisual={XIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            notebookStore.delete(notebookId);
          }}>
            Delete
          </Button>
        </span>
        {nbgrader &&
          <ActionMenu>
            <CellMetadataEditor notebookId={notebookId} cell={activeCell} nbgrader={nbgrader}/>
          </ActionMenu>
        }
      </Box>
    :
      <></>
  )
}

export default CellSidebar;
