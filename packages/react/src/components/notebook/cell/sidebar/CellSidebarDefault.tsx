import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { ActionMenu, Button, IconButton } from "@primer/react";
import { KebabHorizontalIcon, ChevronRightIcon, XIcon, ChevronUpIcon, ChevronDownIcon } from "@primer/octicons-react";
import { DLA_CELL_HEADER_CLASS } from './base/CellSidebarWidget';
import { notebookActions, selectActiveCell } from '../../NotebookState';
import { CellSidebarProps } from './base/CellSidebarWidget';
import CellMetadataEditor from '../metadata/CellMetadataEditor';

export const CellSidebarDefault = (props: CellSidebarProps) => {
  const [visible, setVisible] = useState(false);
  const { nbgrader } = props;
  const dispatch = useDispatch();
  const activeCell = selectActiveCell();
  const layout = (activeCell?.layout);
  if (layout) {
    const cellWidget = (layout as PanelLayout).widgets[0];
    if (!visible && (cellWidget?.node.id === props.id)) {
      setVisible(true);
    }
    if (visible && (cellWidget?.node.id !== props.id)) {
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
            dispatch(notebookActions.run.started());
          }}>
            Run
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertAbove.started("code"));
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronUpIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertAbove.started("markdown"));
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
        {/* activeCell.model.type === "code" ?
            <Button leadingIcon={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started("markdown"));
            }}>
              To Mardown
            </Button>
          :
            <Button leadingIcon={SquareIcon} variant="invisible" size="small" onClick={(e: any) => {
              e.preventDefault();
              dispatch(notebookActions.changeCellType.started("code"));
            }}>
              To Code
            </Button>
        */}
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertBelow.started("markdown"));
          }}>
            Markdown
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={ChevronDownIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.insertBelow.started("code"));
          }}>
            Code
          </Button>
        </span>
        <span style={{ display: "flex" }}>
          <Button leadingIcon={XIcon} variant="invisible" size="small" onClick={(e: any) => {
            e.preventDefault();
            dispatch(notebookActions.delete.started());
          }}>
            Delete
          </Button>
        </span>
        {nbgrader &&
          <ActionMenu>
            <ActionMenu.Anchor>
              <IconButton icon={KebabHorizontalIcon} variant="invisible" aria-label="Open column options" />
            </ActionMenu.Anchor>
            <ActionMenu.Overlay>
              <CellMetadataEditor cell={activeCell} nbgrader={nbgrader}/>
            </ActionMenu.Overlay>
          </ActionMenu>
        }
      </div>
    :
      <></>
  )
}

export default CellSidebarDefault;
