import React from "react";
import { useDispatch } from "react-redux";
import Button from '@mui/material/Button';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Typography from '@mui/material/Typography';
import { notebookActions } from '../../components/notebook/NotebookState';

const NotebookControl: React.FC = () => {
  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Notebook
      </Typography>
      <>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PlayCircleOutline />}
          onClick={() => dispatch(notebookActions.run.started())}
          >
            Execute
        </Button>
      </>
      <Button 
        variant="outlined"
        color="secondary"
        startIcon={<SaveOutlined />}
        onClick={() => dispatch(notebookActions.save.started())}
        >
          Save
      </Button>
      <Typography variant="subtitle1" gutterBottom>
        {/* Notebook: {notebook.notebookChange.cellsChange} */}
      </Typography>
    </>
  );
}

export default NotebookControl;
