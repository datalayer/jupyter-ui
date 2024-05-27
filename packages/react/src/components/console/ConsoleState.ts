/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/* State */

import ConsoleAdapter from './ConsoleAdapter';

export type IConsole = number;

export interface IConsoleState {
  outputs: IConsole;
  adapter?: ConsoleAdapter;
}
