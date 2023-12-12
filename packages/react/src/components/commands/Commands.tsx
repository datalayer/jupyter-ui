/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import CommandAdapter from './CommandsAdapter';
import Lumino from '../../jupyter/lumino/Lumino';

export const Commands = () => {
  const commandsAdapter = new CommandAdapter();
  return <Lumino>{commandsAdapter.panel}</Lumino>
}

export default Commands;
