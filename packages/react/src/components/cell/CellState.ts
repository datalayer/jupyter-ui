/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import CellAdapter from './CellAdapter';

/* State */

export interface ICellState {
  source: string;
  outputsCount: number;
  kernelAvailable: boolean;
  adapter?: CellAdapter;
}
