import React from 'react';
import {Text} from '@primer/react';
// import { useDispatch } from "react-redux";
// import { selectConsole, consoleActions } from './ConsoleRedux';

const ConsoleToolbar: React.FC = () => {
  //  const console = selectConsole();
  //  const dispatch = useDispatch();
  return (
    <>
      <Text as="h3">Console Example</Text>
      {/*
      <div>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => dispatch(consoleActions.execute())}
          >
            Run
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => dispatch(consoleActions.outputs(0))}
          >
            Reset Outputs
        </Button>
      </div>
      <Typography variant="subtitle1" gutterBottom>
        Console: {console.outputs}
      </Typography>
*/}
    </>
  );
};

export default ConsoleToolbar;
