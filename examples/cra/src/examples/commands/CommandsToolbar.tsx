import React from 'react';
import {Text} from '@primer/react';
// import { useDispatch } from "react-redux";
// import { selectCommands, commandsActions } from './CommandsRedux';

const CommandToolbar: React.FC = () => {
  //  const commands = selectCommands();
  //  const dispatch = useDispatch();
  return (
    <>
      <Text as="h5">Commands Example</Text>
      {/*
      <div>
        <Button 
          variant="outlined"
          color="primary"
          onClick={() => dispatch(commandsActions.execute())}
          >
            Run
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => dispatch(commandsActions.outputs(0))}
          >
            Reset Outputs
        </Button>
      </div>
      <Typography variant="subtitle1" gutterBottom>
        Commands: {commands.outputs}
      </Typography>
*/}
    </>
  );
};

export default CommandToolbar;
