import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { PanelLayout } from '@lumino/widgets';
import { DLA_CELL_HEADER_CLASS } from './base/CellSidebarWidget';
import { notebookActions, selectActiveCell } from '../../NotebookState';
import { CellSidebarProps } from './base/CellSidebarWidget';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';

export const CellSidebarNew = (props: CellSidebarProps) => {
  const { notebookId } = props;
  const [visible, setVisible] = useState(false);
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
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.run.started(notebookId)) }}
            style={{ color: 'grey' }}>
            <PlayArrowIcon fontSize="inherit" />
          </IconButton>
        </span>
        <span style={{ display: "flex" }}>
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Add Code Above" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertAbove.started({ uid: notebookId, cellType: "code" })); }}
            style={{ color: 'grey' }}>
            <KeyboardArrowUpIcon fontSize="inherit" />
          </IconButton>
        </span>
        <span style={{ display: "flex" }}>
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertAbove.started({ uid: notebookId, cellType: "markdown" })); }}
            style={{ color: 'grey' }}>
            <KeyboardDoubleArrowUpIcon fontSize="inherit" />
          </IconButton>
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
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "markdown" })); }}
            style={{ color: 'grey' }}>
            <KeyboardDoubleArrowDownIcon fontSize="inherit" />
          </IconButton>
        </span>
        <span style={{ display: "flex" }}>
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "code" })); }}
            style={{ color: 'grey' }}>
            <KeyboardArrowDownIcon fontSize="inherit" />
          </IconButton>
        </span>
        <span style={{ display: "flex" }}>
          <IconButton aria-labelledby="" size="small" color="error" aria-label="Delete" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.delete.started(notebookId)) }}>
            <DeleteIcon fontSize="inherit" style={{ color: '#ef9a9a' }} />
          </IconButton>
        </span>
      </div>
      :
      <></>
  )
}

export default CellSidebarNew;
