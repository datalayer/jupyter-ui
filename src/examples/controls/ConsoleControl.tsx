import React from "react";
import Typography from '@mui/material/Typography';
// import { useDispatch } from "react-redux";
// import Button from '@mui/material/Button';
// import { selectConsole, consoleActions } from './ConsoleRedux';

const ConsoleControl: React.FC = () => {
//  const console = selectConsole();
//  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Console
      </Typography>
{/*
      <div>
        <Button
          variant="outlined"
          color="primary"
          onClick={() => dispatch(consoleActions.execute.started())}
          >
            Execute
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          onClick={() => dispatch(consoleActions.outputs.started(0))}
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
}

export default ConsoleControl;
