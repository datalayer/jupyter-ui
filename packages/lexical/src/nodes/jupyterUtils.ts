/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { IOutput } from '@jupyterlab/nbformat';

/**
 * Creates a warning output message for when no kernel is connected.
 * This message is shown to users when they try to execute code without a kernel.
 *
 * @returns IOutput object containing the warning message
 */
export function createNoKernelWarning(): IOutput {
  return {
    output_type: 'stream',
    name: 'stderr',
    text: ['⚠️  No kernel connected. Please connect to execute code.\n'],
  };
}
