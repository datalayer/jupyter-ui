/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import TerminalAdapter from './TerminalAdapter';

/* State */

export type ITerminal = boolean;

export interface ITerminalState {
  dark: ITerminal;
  adapter?: TerminalAdapter;
}
