/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/* State */

export namespace OutputState {
  export type ISource = {
    sourceId: string;
    source: string;
    increment?: number;
  };
  export type IDataset = {
    sourceId: string;
    dataset: any;
    increment?: number;
  };
  export type IExecute = {
    sourceId: string;
    source: string;
    increment?: number;
  };
  export type IGrade = {
    sourceId: string;
    success: boolean;
    increment?: number;
  };
}

export type IOutputState = {
  source?: OutputState.ISource;
  dataset?: OutputState.IDataset;
  setSource?: OutputState.ISource;
  execute?: OutputState.IExecute;
  grade?: OutputState.IGrade;
};

export interface IOutputsState {
  outputs: Map<string, IOutputState>;
}
