import React from 'react';
import {useDispatch} from 'react-redux';
import {Text} from '@primer/react';
import {Button} from '@primer/react';
import {selectCell, cellActions} from '@datalayer/jupyter-react';

const CellToolbar: React.FC = () => {
  const cell = selectCell();
  const dispatch = useDispatch();
  return (
    <>
      <Text as="h5">Cell Example</Text>
      <Button variant="primary" onClick={() => dispatch(cellActions.execute())}>
        Run
      </Button>
      <Button
        variant="outline"
        onClick={() => dispatch(cellActions.outputsCount(0))}
      >
        Reset outputs count
      </Button>
      <Text as="h4">Outputs count: {cell.outputsCount}</Text>
    </>
  );
};

export default CellToolbar;
