import React from "react";
import { useDispatch } from "react-redux";
import { selectInit, initActions } from './InitState';

const Init: React.FC = () => {
  const init = selectInit();
  const dispatch = useDispatch();
  return (
    <>
      <h2>Init value: {init}</h2>
      <button
        onClick={() => dispatch(initActions.increment.started())}
      >
        Increment Init (1 second delay)
      </button>
      <button
        onClick={() => dispatch(initActions.decrement.started())}
      >
        Decrement Init (0.2 second delay)
      </button>
    </>
  );
}

export default Init;
