import Paper from '@mui/material/Paper';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { Jupyter, Notebook } from '@datalayer/jupyter-react';
import NotebookToolbar from './NotebookToolbar';
import CellSidebarComponent from './CellSidebarComponent';

const NOTEBOOK_UID = "notebook-id-simple"

const useStyles = makeStyles((theme: Theme) =>
  ({
    root: {
//      marginLeft: theme.spacing(16),
//      marginRight: theme.spacing(16),
      minWidth: '500px',
      display: 'flex',
      flexWrap: 'wrap',
      '& > *': {
//        margin: theme.spacing(1),
//        width: theme.spacing(16),
      },
    },
  }),
);

export default function NotebookSidebarComponent() {
  const classes = useStyles();
  return (
    <Jupyter collaborative={false} terminals={true}>
      <div className={classes.root}>
        <Paper elevation={3} style={{ width: '100%' }}>
          <NotebookToolbar notebookId={NOTEBOOK_UID}/>
          <Notebook
            uid={NOTEBOOK_UID}
            path='ping.ipynb'
            ipywidgets='lab'
            CellSidebar={CellSidebarComponent}
            />
        </Paper>
      </div>
    </Jupyter>
  );
}
