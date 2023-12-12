/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

export type CellTypes = 'code' | 'text';

export interface Cell {
  id: string;
  type: CellTypes;
  content: string;
}
