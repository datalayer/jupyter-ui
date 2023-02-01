import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import SyncIcon from '@mui/icons-material/Sync';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import { cmdIds } from '../../components/notebook/NotebookCommands';
import { IJupyterReactState } from '../../state/State';
import { notebookActions, selectNotebook, selectSaveRequest } from '../../components/notebook/NotebookState';

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  '& .MuiToggleButtonGroup-grouped': {
    margin: theme.spacing(0.5),
    border: 0,
    '&.Mui-disabled': {
      border: 0,
    },
    '&:not(:first-of-type)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-of-type': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}));

const NotebookToolbar = (props: { notebookId: string }) => {
  const { notebookId } = props;
  const [autoSave, setAutoSave] = useState(false);
  const [addType, setAddType] = useState('code');
  const dispatch = useDispatch();
  const notebook = selectNotebook(notebookId);
  const saveRequest = selectSaveRequest(notebookId);
  const notebookstate = useSelector((state: IJupyterReactState) => {
    return state.notebook;
  });

  useEffect(() => {
    notebook?.adapter?.commands.execute(cmdIds.save)
  }, [saveRequest]);

  useEffect(() => {
    if (autoSave) {
      notebook?.adapter?.commands.execute(cmdIds.save)
    }
  }, [notebookstate]);

  const handleChangeCellType = (
    event: React.MouseEvent<HTMLElement>,
    newType: string,
  ) => {
    setAddType(newType);
  };

  return (
    <div style={{ display: 'flex', width: '100%', borderBottom: '0.1rem solid lightgrey', position: 'relative', zIndex: '1', backgroundColor: 'white', top: '0' }}>
      <div style={{
        display: 'flex',
        width: '50%',
        paddingLeft: '7vw',
        gap: '0.75vw',
      }}>
        <IconButton aria-labelledby="" size="small" color="primary" aria-label="Save" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.save.started({ uid: notebookId, date: new Date() })) }} style={{ color: 'grey' }}>
          <SaveIcon fontSize="inherit" />
        </IconButton>
        <IconButton
          size="small"
          color="primary"
          aria-label="Insert Cell"
          onClick={(e) => {
            e.preventDefault();
            dispatch(notebookActions.insertBelow.started({ uid: notebookId, cellType: addType }))
          }}
          style={{ color: 'grey' }}>
          <AddIcon fontSize="inherit" />
        </IconButton>
        <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.run.started(notebookId)) }}
          style={{ color: 'grey' }}>
          <PlayArrowIcon fontSize="inherit" />
        </IconButton>
        {(notebook?.kernelStatus === 'idle') &&
          <IconButton aria-labelledby="" size="small" color="secondary" aria-label="Run All Cells" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.runAll.started(notebookId)) }}
            style={{ color: 'grey' }}>
            <FastForwardIcon fontSize="inherit" />
          </IconButton>
        }
        {(notebook?.kernelStatus === 'busy') &&
          <IconButton aria-labelledby="" size="small" color="error" aria-label="Interrupt" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.interrupt.started(notebookId)) }}>
            <StopIcon fontSize="inherit" style={{ color: '#e57373' }} />
          </IconButton>
        }
        <IconButton aria-labelledby="" size="small" color="error" aria-label="Delete" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.delete.started(notebookId)) }}>
          <DeleteIcon fontSize="inherit" style={{ color: '#e57373' }} />
        </IconButton>
      </div>
      <div style={{
        display: 'flex',
        width: '50%',
        paddingRight: '7vw',
        gap: '0.75vw',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <ToggleButton
          value="Auto Save"
          selected={autoSave}
          onChange={(e) => {
            e.preventDefault()
            setAutoSave(!autoSave);
          }}
          size="small"
          color={autoSave ? "success" : "error"}
          style={{
            height: '1.5rem',
            width: '1.5rem'
          }}
        >
          <SyncIcon fontSize="small" style={{ height: '1rem', width: '1rem' }} />
        </ToggleButton>
        <Divider flexItem orientation="vertical" sx={{ mx: 0.5, my: 1 }} />
        <StyledToggleButtonGroup
          size="small"
          value={addType}
          exclusive
          onChange={handleChangeCellType}
          aria-label="text alignment"
        >
          <ToggleButton value="code" aria-label="left aligned">
            <div style={{ fontSize: '0.60rem' }}>
              Code
            </div>
          </ToggleButton>
          <ToggleButton value="markdown" aria-label="centered">
            <div style={{ fontSize: '0.60rem' }}>
              Markdown
            </div>
          </ToggleButton>
          <ToggleButton value="raw" aria-label="right aligned">
            <div style={{ fontSize: '0.60rem' }}>
              Raw
            </div>
          </ToggleButton>
        </StyledToggleButtonGroup>
      </div>
    </div>
  )
}

export default NotebookToolbar;
