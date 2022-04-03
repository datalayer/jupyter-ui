import React from 'react';
import { useDispatch } from "react-redux";
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import { terminalActions } from '../../components/terminal/TerminalState';

const TerminalControl: React.FC = () => {
  const dispatch = useDispatch();
  const [state, setState] = React.useState({
    dark: false,
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(terminalActions.dark.started(event.target.checked));
    setState({ ...state, [event.target.name]: event.target.checked });
  };
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Terminal
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

export default TerminalControl;
