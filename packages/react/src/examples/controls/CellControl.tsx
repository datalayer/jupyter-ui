import React from "react";
import { useDispatch } from "react-redux";
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { selectCell, cellActions } from './../../index';

const CellControl: React.FC = () => {
  const cell = selectCell();
  const dispatch = useDispatch();
  return (
    <>
      <Typography variant="h5" gutterBottom>
        Cell
      </Typography>
      <div>
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
      </div>
      <Typography variant="subtitle1" gutterBottom>
        Outputs count: {cell.outputsCount}
      </Typography>
    </>
  );
}

export default CellControl;
