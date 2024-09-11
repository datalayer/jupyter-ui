/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { OutputArea } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import { JSONObject } from '@lumino/coreutils';
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

  const future = kernelExecutor!.future;
  // TODO fix in upstream jupyterlab if possible...
  (output as any)._onIOPub = future!.onIOPub;
  (output as any)._onExecuteReply = future!.onReply;
  output.future = future!;
  return future?.done;
}
