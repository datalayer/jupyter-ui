import React, { useState } from 'react';
import { useDispatch } from "react-redux";
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { terminalActions } from '@datalayer/jupyter-react';

const TerminalToolbar: React.FC = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    dark: false,
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(terminalActions.update({ dark: event.target.checked }));
    setState({ ...state, [event.target.name]: event.target.checked });
  };
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Terminal Example
      </Typography>
      <FormGroup row>
        <FormControlLabel
          control={<Switch checked={state.dark} onChange={handleChange} name="dark" />}
          label="Dark mode"
        />
      </FormGroup>
    </>
  );
}

export default TerminalToolbar;
