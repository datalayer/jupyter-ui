import { useState } from 'react';
import { useDispatch } from 'react-redux';
import PlayArrow from '@mui/icons-material/PlayArrowOutlined';
import Delete from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { PanelLayout } from '@lumino/widgets';
import { selectNotebook, notebookActions, CellSidebarProps } from '@datalayer/jupyter-react';

const CELL_HEADER_DIV_CLASS = 'dla-CellHeader-container';

const CellSidebarComponent = (props: CellSidebarProps) => {
  const { notebookId } = props;
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const layout = notebook?.activeCell?.layout;
  if (layout) {
    const selectedCellSidebar = (notebook?.activeCell?.layout as PanelLayout).widgets[0];
    if (!visible && (selectedCellSidebar.id === props.cellId)) {
      setVisible(true);
    }
    if (visible && (selectedCellSidebar.id !== props.cellId)) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>
  }
  return (
    <div className={CELL_HEADER_DIV_CLASS}>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.run.started(notebookId));
        }}
      >
        <span style={{ display: "flex" }}>
          <PlayArrow fontSize="small" />
          <Typography variant="body2" color="textSecondary">Run</Typography>
        </span>
      </div>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.insertAbove.started({ uid: notebookId, cellType: "code" }));
        }}
      >
        <span style={{ display: "flex" }}>
          <ArrowUpwardIcon fontSize="small" />
          <Typography variant="body2" color="textSecondary">Add above</Typography>
        </span>
      </div>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "code" }));
        }}
      >
        <span style={{ display: "flex" }}>
          <ArrowDownwardIcon fontSize="small" />
          <Typography variant="body2" color="textSecondary">Add below</Typography>
        </span>
      </div>
      <div
        onClick={e => {
          e.preventDefault();
          dispatch(notebookActions.delete.started(notebookId));
        }}
      >
        <span style={{ display: "flex" }}>
          <Delete fontSize="small" />
          <Typography variant="body2" color="textSecondary">Delete</Typography>
        </span>
      </div>
    </div>
  );
}

export default CellSidebarComponent;
