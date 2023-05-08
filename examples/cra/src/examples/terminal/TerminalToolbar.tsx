import React, {useState} from 'react';
import {useDispatch} from 'react-redux';
import {FormControl, Text, ToggleSwitch} from '@primer/react';
import {terminalActions} from '@datalayer/jupyter-react';

const TerminalToolbar: React.FC = () => {
  const dispatch = useDispatch();
  const [state, setState] = useState({
    dark: false,
  });
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(terminalActions.update({dark: event.target.checked}));
    setState({...state, [event.target.name]: event.target.checked});
  };
  const onClick = () => {
    dispatch(terminalActions.update({dark: !state.dark}));
    setState({...state, dark: !state.dark});
  };
  return (
    <>
      <Text as="h3">Terminal Example</Text>
      <FormControl
        sx={{
          paddingLeft: 5,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <FormControl.Label>
          <Text as="p" sx={{display: 'block'}}>
            Dark Mode
          </Text>
        </FormControl.Label>
        <ToggleSwitch
          aria-labelledby="switchLabel"
          onClick={onClick}
          checked={state.dark}
        />
      </FormControl>
    </>
  );
};

export default TerminalToolbar;
