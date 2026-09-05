/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { JSONObject } from '@lumino/coreutils';
import { OutputArea } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import { IExecutionPhaseOutput } from '../../jupyter/kernel';
import { Kernel } from './../../jupyter/kernel/Kernel';

/**
 * Execute code on an output area.
 */
export async function execute(
  id: string,
  code: string,
  output: OutputArea,
  kernel: Kernel,
  metadata?: JSONObject,
  suppressCodeExecutionErrors: boolean = false,
  onExecutionPhaseChanged?: (phaseOutput: IExecutionPhaseOutput) => void
): Promise<KernelMessage.IExecuteReplyMsg | undefined> {
  // Override the default for `stop_on_error`.
  let stopOnError = true;
  if (
    metadata &&
    Array.isArray(metadata.tags) &&
    metadata.tags.indexOf('raises-exception') !== -1
  ) {
    stopOnError = false;
  }
  const kernelExecutor = kernel.execute(code, {
    model: output.model,
    stopOnError,
    suppressCodeExecutionErrors,
    onExecutionPhaseChanged,
  });

  const future = kernelExecutor?.future;
  if (!future) {
    // The kernel handed back nothing to wait on — it is not connected yet, or
    // no longer is. Said once, in words, rather than thrown from inside an
    // effect where nobody catches it and the page logs a bare TypeError.
    console.warn(
      `execute: the kernel returned no execution for output ${id}; is it connected?`
    );
    return undefined;
  }
  // TODO fix in upstream jupyterlab if possible...
  (output as any)._onIOPub = future.onIOPub;
  (output as any)._onExecuteReply = future.onReply;
  output.future = future;
  return future.done;
}
