import { useSelector } from "react-redux";
import actionCreatorFactory from "typescript-fsa";
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { IJupyterReactState } from "../../redux/State";

/* State */

namespace OutputState {
  export type ISource = {
    sourceId: string;
    source: string;
    increment?: number;
  }
  export type IDataset = {
    sourceId: string;
    dataset: any;
    increment?: number;
  }
  export type IExecute = {
    sourceId: string;
    source: string;
    increment?: number;
  }
  export type IGrade = {
    sourceId: string;
    success: boolean;
    increment?: number;
  }
}

export type IOutputState = {
  source?: OutputState.ISource;
  dataset?: OutputState.IDataset;
  setSource?: OutputState.ISource;
  execute?: OutputState.IExecute;
  grade?: OutputState.IGrade;
}

export interface IOutputsState {
  outputs: Map<string, IOutputState>;
}

export const outputInitialState: IOutputsState = {
  outputs: new Map<string, IOutputState>(),
}

/* Selectors */

export const selectJupyterSource = (id: string): OutputState.ISource | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.output) {
      return state.output.outputs.get(id)?.source;
    }
    return undefined;
  }
);

export const selectJupyterSetSource = (id: string): OutputState.ISource | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.output) {
      return state.output.outputs.get(id)?.setSource;
    }
    return undefined;
  }
);

export const selectDataset = (id: string): OutputState.IDataset | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.output) {
      return state.output.outputs.get(id)?.dataset;
    }
    return undefined;
  }
);

export const selectExecute = (id: string): OutputState.IExecute | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.output) {
      return state.output.outputs.get(id)?.execute;
    }
    return undefined;
  }
);

export const selectGrade = (id: string): OutputState.IGrade | undefined =>
  useSelector((state: IJupyterReactState) => {
    if (state.output) {
      return state.output.outputs.get(id)?.grade;
    }
    return undefined;
  }
);

/* Actions */

export enum OutputActionType {
  SOURCE = 'output/SOURCE',
  DATASET = 'output/DATASET',
  EXECUTE = 'output/EXECUTE',
  SET_SOURCE = 'output/SET_SOURCE',
  GRADE = 'output/GRADE',
}

const actionCreator = actionCreatorFactory('jupyterOutput');

export const outputActions = {
  source: actionCreator<OutputState.ISource>(
    OutputActionType.SOURCE
  ),
  dataset: actionCreator<OutputState.IDataset>(
    OutputActionType.DATASET
  ),
  execute: actionCreator<OutputState.IExecute>(
    OutputActionType.EXECUTE
  ),
  setSource: actionCreator<OutputState.IExecute>(
    OutputActionType.SET_SOURCE
  ),
  grade: actionCreator<OutputState.IGrade>(
    OutputActionType.GRADE
  ),
}

/* Reducers */

export const outputReducer = reducerWithInitialState(outputInitialState)
  .case(outputActions.source, (state: IOutputsState, source: OutputState.ISource) => {
    const sourceId = source.sourceId;
    const outputs = state.outputs;
    const s = outputs.get(sourceId);
    if (s) {
      s.source = source;
    } else {
      outputs.set(sourceId, { source });
    }
    return {
      ...state,
      outputs,
    }
  })
  .case(outputActions.dataset, (state: IOutputsState, dataset: OutputState.IDataset) => {
    const sourceId = dataset.sourceId;
    const outputs = state.outputs;
    const d = outputs.get(sourceId);
    if (d) {
      d.dataset = dataset;
    } else {
      outputs.set(sourceId, { dataset });
    }
    return {
      ...state,
      outputs,
    }
  })
  .case(outputActions.execute, (state: IOutputsState, execute: OutputState.IExecute) => {
    const sourceId = execute.sourceId;
    const outputs = state.outputs;
    const e = outputs.get(sourceId);
    if (e) {
      e.execute = execute;
    } else {
      outputs.set(sourceId, { execute });
    }
    return {
      ...state,
      outputs,
    }
  })
  .case(outputActions.setSource, (state: IOutputsState, setSource: OutputState.ISource) => {
    const sourceId = setSource.sourceId;
    const outputs = state.outputs;
    const s = outputs.get(sourceId);
    if (s) {
      s.setSource = setSource;
    } else {
      outputs.set(sourceId, { setSource });
    }
    return {
      ...state,
      outputs,
    }
  })
  .case(outputActions.grade, (state: IOutputsState, grade: OutputState.IGrade) => {
    const sourceId = grade.sourceId;
    const outputs = state.outputs;
    const g = outputs.get(sourceId);
    if (g) {
      g.grade = grade;
    } else {
      outputs.set(sourceId, { grade });
    }
    return {
      ...state,
      outputs,
    }
  }
)
