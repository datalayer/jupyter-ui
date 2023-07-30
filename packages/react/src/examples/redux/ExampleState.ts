import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { IJupyterReactState } from "./../../redux/State";

/* State */

export interface IExampleState {
  foo?: Date;
}

export const initExampleState: IExampleState = {
  foo: undefined,
}

/* Selectors */

export const selectFoo = (): Date | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.init) {
      return (state.init as IExampleState).foo;
    }
    return initExampleState.foo;
  }
);

/* Actions */

export enum ExampleActionType {
  UPDATE_FOO = "jupyterReact/UPDATE_FOO",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const exampleActions = {
  updateFoo: actionCreator<Date>(
    ExampleActionType.UPDATE_FOO
  ),
}

/* Reducers */

export const exampleReducer = reducerWithInitialState(initExampleState)
  .case(exampleActions.updateFoo, (state: IExampleState, foo: Date) => {
    return {
      ...state,
      foo,
    };
  }
);
