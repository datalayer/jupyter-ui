/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { IOutput } from '@jupyterlab/nbformat';

/**
 * Creates a warning output message for when no runtime is connected.
 * This message is shown to users when they try to execute code without a runtime.
 *
 * @returns IOutput object containing the warning message
 */
export function createNoRuntimeWarning(): IOutput {
  return {
    output_type: 'stream',
    name: 'stderr',
    text: [
      '⚠️  No runtime connected. Please connect to a runtime to execute code.\n',
    ],
  };
}
