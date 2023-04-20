import { useDispatch } from "react-redux";
import Button from '@mui/material/Button';
import PlayCircleOutline from '@mui/icons-material/PlayCircleOutline';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import Typography from '@mui/material/Typography';
import { notebookActions } from '@datalayer/jupyter-react';

const NotebookSimpleToolbar = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Notebook Example
      </Typography>
      <>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<PlayCircleOutline />}
          onClick={() => dispatch(notebookActions.run.started(notebookId))}
          >
            Run
        </Button>
      </>
      <Button 
        variant="outlined"
        color="secondary"
        startIcon={<SaveOutlined />}
        onClick={() => dispatch(notebookActions.save.started({ uid: notebookId, date: new Date() }))}
        >
          Save
      </Button>
      <Typography variant="subtitle1" gutterBottom>
        {/* Notebook: {notebook.notebookChange.cellsChange} */}
      </Typography>
    </>
  );
}

export default NotebookSimpleToolbar;
