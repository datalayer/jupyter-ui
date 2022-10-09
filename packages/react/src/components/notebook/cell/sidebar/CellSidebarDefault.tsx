import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button } from "@primer/react";
import { ChevronRightIcon, XIcon, ChevronUpIcon, ChevronDownIcon, SquareIcon } from "@primer/octicons-react";
import { DLA_CELL_HEADER_CLASS } from './base/CellSidebarWidget';
import { notebookActions, selectActiveCell } from '../../NotebookState';
import { CellSidebarProps } from './base/CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';

export const CellSidebarDefault = (props: CellSidebarProps) => {
  const [visible, setVisible] = useState(false);
  const { notebookId, nbgrader } = props;
  const dispatch = useDispatch();
  const activeCell = selectActiveCell(notebookId);
  const layout = (activeCell?.layout);
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (!visible && (cellWidget?.node.id === props.cellId)) {
      setVisible(true);
    }
    if (visible && (cellWidget?.node.id !== props.cellId)) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>
  }
  return (
    activeCell ? 
      <div
        className={DLA_CELL_HEADER_CLASS}
        css={{
          '& p': {
            marginBottom: '0 !important',
          }
        }}
      >
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronRightIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.run.started(notebookId));
          }}>
            Run
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertAbove.started({ uid: notebookId, cellType: "code" }));
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertAbove.started({ uid: notebookId, cellType: "markdown" }));
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
        { activeCell.model.type === "code" ?
            <Button leadingIcon={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started({ uid: notebookId, cellType: "markdown" }));
            }}>
              To Mardown
            </Button>
          :
            <Button leadingIcon={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started({ uid: notebookId, cellType: "code" }));
            }}>
              To Code
            </Button>
        }
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "markdown" }));
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "code" }));
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={XIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.delete.started(notebookId));
          }}>
            Delete
          </Button>
        </span>
        {nbgrader &&
          <ActionMenu>
            {/*
            <ActionMenu.Anchor>
              <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay>
            */}
              <CellMetadataEditor notebookId={notebookId} cell={activeCell} nbgrader={nbgrader}/>
            {/*
            </ActionMenu.Overlay>
            */}
          </ActionMenu>
        }
      </div>
    :
      <></>
  )
}

export default CellSidebarDefault;
