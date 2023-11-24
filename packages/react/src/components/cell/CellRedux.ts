import actionCreatorFactory from "typescript-fsa";
import { useSelector } from "react-redux";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import CellAdapter from "./CellAdapter";

/* State */

export interface ICellState {
  source: string,
  outputsCount: number;
  kernelAvailable: boolean;
  adapter?: CellAdapter;
}

export const cellInitialState: ICellState = {
  source: '',
  outputsCount: -1,
  kernelAvailable: false,
}

/* Selectors */

export const selectCell = (): ICellState =>
  useSelector((state: ICellState) => {
    if ((state as any).cell) {
      return (state as any).cell;
    }
    return cellInitialState;
  }
);

/* Actions */

export enum CellActionType {
  SOURCE = "cell/SOURCE",
  OUTPUTS_COUNT = "cell/OUTPUTS_COUNT",
  EXECUTE = "cell/EXECUTE",
  UPDATE = "cell/UPDATE",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const cellActions = {
  source: actionCreator<string>(
    CellActionType.SOURCE
  ),
  outputsCount: actionCreator<number>(
    CellActionType.OUTPUTS_COUNT
  ),
  execute: actionCreator<void>(
    CellActionType.EXECUTE
  ),
  update: actionCreator<Partial<ICellState>>(
    CellActionType.UPDATE
  ),
}

/* Reducers */

export const cellReducer = reducerWithInitialState(cellInitialState)
  .case(cellActions.execute, (state: ICellState, payload: void) => {
    if (state.adapter) {
      state.adapter.execute();
    }
    return {
      ...state,
    }
  })
  .case(cellActions.source, (state: ICellState, source: string) => {
    return {
      ...state,
      source,
    }
  })
  .case(cellActions.update, (state: ICellState, partial: Partial<ICellState>) => ({
    ...state,
    ...partial,
  }))
  .case(cellActions.outputsCount, (state: ICellState, outputsCount: number) => {
    return {
      ...state,
      outputsCount,
    }
  }
);
