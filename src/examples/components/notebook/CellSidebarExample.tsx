import { useState } from 'react';
import { useDispatch } from 'react-redux';
import PlayArrow from '@mui/icons-material/PlayArrowOutlined';
import Delete from '@mui/icons-material/DeleteOutline';
import Typography from '@mui/material/Typography';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { PanelLayout } from '@lumino/widgets';
import { selectNotebook, notebookActions } from '../../../components/notebook/NotebookState';

const CELL_HEADER_DIV_CLASS = 'dla-cellHeaderContainer';

const CellSidebarExample = (props: any) => {
  const [visible, setVisible] = useState(false);
  const dispatch = useDispatch();
  const notebook = selectNotebook();
  const layout = (notebook.activeCell?.layout);
  if (layout) {
    const selectedCellSidebar = (notebook.activeCell?.layout as PanelLayout).widgets[0];
    if (!visible && (selectedCellSidebar.id === props.id)) {
      setVisible(true);
    }
    if (visible && (selectedCellSidebar.id !== props.id)) {
      setVisible(false);
    }
  }
  if (!visible) {
    return <div></div>
  }
  return (
    <div className={CELL_HEADER_DIV_CLASS}>
      <div
        onClick={event => {
          dispatch(notebookActions.run());
        }}
      >
        <span style={{ display: "flex" }}>
          <PlayArrow fontSize="small" />
          <Typography variant="body2" color="textSecondary">Render</Typography>
        </span>
      </div>
      <div
        onClick={event => {
          dispatch(notebookActions.insertAbove());
        }}
      >
        <span style={{ display: "flex" }}>
          <ArrowUpwardIcon fontSize="small" />
          <Typography variant="body2" color="textSecondary">Add above</Typography>
        </span>
      </div>
      <div
        onClick={event => {
          dispatch(notebookActions.insertBelow());
        }}
      >
        <span style={{ display: "flex" }}>
          <ArrowDownwardIcon fontSize="small" />
          <Typography variant="body2" color="textSecondary">Add below</Typography>
        </span>
      </div>
      <div
        onClick={event => {
          dispatch(notebookActions.delete(undefined));
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

export default CellSidebarExample;
