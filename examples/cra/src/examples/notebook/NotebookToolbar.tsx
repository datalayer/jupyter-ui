import React, { useState } from 'react';
import { useDispatch } from "react-redux";
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';
import QuestionAnswerOutlined from '@mui/icons-material/QuestionAnswerOutlined';
import { Terminal, notebookActions, selectNotebook } from '@datalayer/jupyter-react';

const terminal = <Terminal />

const NotebookToolbar = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const [state, setState] = useState({
    terminal: false,
  });
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, [event.target.name]: event.target.checked });
  };
  return (
    <>
      <Grid container spacing={3} style={{ padding: '30px 110px 0px 30px' }}>
        <Grid item xs={6}>
          <Grid container justifyItems="flex-start">
            <Button
              variant="text"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "raw" })) }}
            >
              Raw
            </Button>
            <Button
              variant="text"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "markdown" })) }}
            >
              Markdown
            </Button>
            <Button
              variant="text"
              color="primary"
              startIcon={<AddCircleOutlineIcon />}
              onClick={(e) => { e.preventDefault(); dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: "code" })) }}
            >
              Code
            </Button>
            <FormGroup row style={{ paddingLeft: 10 }}>
              <FormControlLabel
                control={<Switch checked={state.terminal} onChange={handleChange} name="terminal" />}
                label={<Typography variant="body2" display="block">Terminal</Typography>}
              />
            </FormGroup>
          </Grid>
        </Grid>
        <Grid item xs={6}>
          <Grid container justifyItems="flex-end">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<SaveOutlined />}
              onClick={() => dispatch(notebookActions.save.started({ uid: notebookId, date: new Date() }))}
            >
              Save
            </Button>
            {(notebook?.kernelStatus === 'idle') &&
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={(e) => { e.preventDefault(); dispatch(notebookActions.runAll.started(notebookId)) }}
              >
                Run all
              </Button>
            }
            {(notebook?.kernelStatus === 'busy') &&
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<StopOutlined />}
                onClick={(e) => { e.preventDefault(); dispatch(notebookActions.interrupt.started(notebookId)) }}
              >
                Stop
              </Button>
            }
            {((notebook?.kernelStatus !== 'idle') && (notebook?.kernelStatus !== 'busy')) &&
              <Button
                variant="outlined"
                color="primary"
                startIcon={<QuestionAnswerOutlined />}
              >
              </Button>
            }
          </Grid>
        </Grid>
      </Grid>
      {state.terminal && terminal}
    </>
  )
}

export default NotebookToolbar;
