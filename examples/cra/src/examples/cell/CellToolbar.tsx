import React from "react";
import { useDispatch } from "react-redux";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { selectCell, cellActions } from '@datalayer/jupyter-react';

const CellToolbar: React.FC = () => {
  const cell = selectCell();
  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Cell Example
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => dispatch(cellActions.execute())}
        >
          Run
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => dispatch(cellActions.outputsCount(0))}
        >
          Reset outputs count
      </Button>
      <Typography variant="subtitle1" gutterBottom>
        Outputs count: {cell.outputsCount}
      </Typography>
    </>
  );
}

export default CellToolbar;
