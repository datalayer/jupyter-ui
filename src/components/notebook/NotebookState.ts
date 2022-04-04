import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { NotebookChange } from "@jupyterlab/shared-models";
import { Cell, ICellModel } from "@jupyterlab/cells";
import { Kernel } from "@jupyterlab/services";

/* State */

export interface INotebookState {
  activeCell: Cell<ICellModel> | undefined;
  kernelStatus: Kernel.Status | undefined;
  notebookChange: NotebookChange | undefined;
  portals: React.ReactPortal[];
}

export const notebookInitialState: INotebookState = {
  activeCell: undefined,
  kernelStatus: undefined,
  notebookChange: undefined,
  portals: [],
}

/* Selectors */

export const selectNotebook = (): INotebookState =>
  useSelector((state: INotebookState) => {
    if ((state as any).notebook) {
      return (state as any).notebook;
    }
    return notebookInitialState;
  }
);

/* Actions */

export enum ActionType {
  NOTEBOOK_CHANGE = "notebook/NOTEBOOK_CHANGE",
  ACTIVE_CELL_CHANGE = "notebook/ACTIVE_CELL_CHANGE",
  KERNEL_STATUS_CHANGE = "notebook/KERNEL_STATUS_CHANGE",
  RUN = "notebook/RUN",
  RUN_ALL = "notebook/RUN_ALL",
  SAVE = "notebook/SAVE",
  INTERRUPT = "notebook/INTERRUPT",
  INSERT_ABOVE = "notebook/INSERT_ABOVE",
  INSERT_BELOW = "notebook/INSERT_BELOW",
  DELETE = "notebook/DELETE",
  PORTAL = "notebook/PORTAL",
  SET_PORTALS = "notebook/SET_PORTALS",
}

const actionCreator = actionCreatorFactory('jupyterReact');

export const notebookActions = {
  notebookChange: actionCreator<NotebookChange>(
    ActionType.NOTEBOOK_CHANGE
  ),
  activeCellChange: actionCreator<Cell<ICellModel>>(
    ActionType.ACTIVE_CELL_CHANGE
  ),
  kernelStatusChanged: actionCreator<Kernel.Status>(
    ActionType.KERNEL_STATUS_CHANGE
  ),
  run: actionCreator<void>(
    ActionType.RUN
  ),
  save: actionCreator<void>(
    ActionType.SAVE
  ),
  runAll: actionCreator<void>(
    ActionType.RUN_ALL
  ),
  interrupt: actionCreator<void>(
    ActionType.INTERRUPT
  ),
  insertAbove: actionCreator<void>(
    ActionType.INSERT_ABOVE
  ),
  insertBelow: actionCreator<void>(
    ActionType.INSERT_BELOW
  ),
  delete: actionCreator<void>(
    ActionType.DELETE
  ),
  portal: actionCreator<React.ReactPortal>(
    ActionType.PORTAL
  ),
  setPortals: actionCreator<React.ReactPortal[]>(
    ActionType.SET_PORTALS
  ),
}

/* Reducers */

export const notebookReducer = reducerWithInitialState(notebookInitialState)
  .case(notebookActions.activeCellChange, (state: INotebookState, success: Cell<ICellModel>) => {
    return {
      ...state,
      activeCell: success,
    }
  })
  .case(notebookActions.notebookChange, (state: INotebookState, success: NotebookChange) => {
    return {
      ...state,
      notebookChange: success,
//      portals: new Array<React.ReactPortal>(),
    }
  })
  .case(notebookActions.kernelStatusChanged, (state: INotebookState, success: Kernel.Status) => {
    return {
      ...state,
      kernelStatus: success,
    }
  })
  .case(notebookActions.portal, (state: INotebookState, success: React.ReactPortal) => {
    const portals = state.portals.concat(success);
//    console.log('---', portals)
    return {
      ...state,
      portals,
    }
  })
  .case(notebookActions.setPortals, (state: INotebookState, success: React.ReactPortal[]) => {
    return {
      ...state,
      portals: success,
    }
  }
);
