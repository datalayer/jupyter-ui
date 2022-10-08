import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from "react-redux";
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import AddIcon from '@mui/icons-material/Add';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import StopOutlined from '@mui/icons-material/StopOutlined';
import QuestionAnswerOutlined from '@mui/icons-material/QuestionAnswerOutlined';
import { notebookActions, selectNotebook } from '../components/notebook/NotebookState';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import FastForwardIcon from '@mui/icons-material/FastForward';
import StopIcon from '@mui/icons-material/Stop';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import SyncIcon from '@mui/icons-material/Sync';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { styled } from '@mui/material/styles';
import { IJupyterReactState } from '../state/State';
import { cmdIds } from '../components/notebook/NotebookCommands';

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

const NotebookToolbarAutoSave = () => {
  const [addtype, setaddtype] = useState('code');
  const dispatch = useDispatch();
  const notebook = selectNotebook();
  const notebook_state = useSelector((state: IJupyterReactState) => state.notebook);

  useEffect(() => {
    notebook_state?.adapter?.commands.execute(cmdIds.save)
  }, [notebook_state]);

  const handleChangeCellType = (
    event: React.MouseEvent<HTMLElement>,
    newType: string,
  ) => {
    console.log("Value", newType)
    setaddtype(newType);
  };

  return (
    <div style={{ display: 'flex', width: '100%', borderBottom: '0.1rem solid lightgrey', position: 'relative', zIndex: '1', backgroundColor: 'white', top: '0' }}>
      <div style={{
        display: 'flex',
        width: '50%',
        paddingLeft: '7vw',
        gap: '0.75vw',
      }}>
        <IconButton size="small" color="primary" aria-label="Insert Cell" onClick={(e) => {
          e.preventDefault();
          if (addtype === 'raw')
            dispatch(notebookActions.insertBelow.started("raw"))
          else if (addtype === 'code')
            dispatch(notebookActions.insertBelow.started("code"))
          else if (addtype === 'markdown')
            dispatch(notebookActions.insertBelow.started("markdown"))
        }}
          style={{ color: 'grey' }}>
          <AddIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" color="secondary" aria-label="Run Cell" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.run.started()) }}
          style={{ color: 'grey' }}>
          <PlayArrowIcon fontSize="inherit" />
        </IconButton>
        {(notebook.kernelStatus === 'idle') &&
          <IconButton size="small" color="secondary" aria-label="Run All Cells" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.runAll.started()) }}
            style={{ color: 'grey' }}>
            <FastForwardIcon fontSize="inherit" />
          </IconButton>
        }
        {(notebook.kernelStatus === 'busy') &&
          <IconButton size="small" color="error" aria-label="Interrupt" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.interrupt.started()) }} >
            <StopIcon fontSize="inherit" style={{ color: '#ef9a9a' }} />
          </IconButton>
        }
        <IconButton size="small" color="error" aria-label="Delete" onClick={(e) => { e.preventDefault(); dispatch(notebookActions.delete.started()) }} >
          <DeleteIcon fontSize="inherit" style={{ color: '#ef9a9a' }} />
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

        <StyledToggleButtonGroup
          size="small"
          value={addtype}
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

export default NotebookToolbarAutoSave;
