import Paper from '@mui/material/Paper';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { Jupyter } from '../../../jupyter/Jupyter';
import { Notebook } from '../../../components/notebook/Notebook';
import ToolbarExample from './ToolbarExample';
import CellSidebarExample from './CellSidebarExample';

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

export default function NotebookExample() {
  const classes = useStyles();
  return (
    <Jupyter collaborative={false} terminals={true}>
      <div className={classes.root}>
        <Paper elevation={3} style={{ width: '100%' }}>
          <ToolbarExample />
          <Notebook
            path='ping.ipynb'
            ipywidgets='lab'
            sidebarComponent={CellSidebarExample}
            />
        </Paper>
      </div>
    </Jupyter>
  );
}
