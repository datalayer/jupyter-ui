/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import CommandAdapter from './CommandsAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const Commands = () => {
  const commandsAdapter = new CommandAdapter();
  return <Lumino>{commandsAdapter.panel}</Lumino>;
};

export default Commands;
