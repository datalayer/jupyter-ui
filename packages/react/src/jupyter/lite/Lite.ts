/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { JupyterLiteServerPlugin } from './server';

export type Lite =
  | boolean
  | Promise<{ default: JupyterLiteServerPlugin<any>[] }>;
