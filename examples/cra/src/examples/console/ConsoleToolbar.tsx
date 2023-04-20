import React from "react";
import Typography from '@mui/material/Typography';
// import { useDispatch } from "react-redux";
// import Button from '@mui/material/Button';
// import { selectConsole, consoleActions } from './ConsoleRedux';

const ConsoleToolbar: React.FC = () => {
//  const console = selectConsole();
//  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Console Example
      </Typography>
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
}

export default ConsoleToolbar;
