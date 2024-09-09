/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { JSONObject } from '@lumino/coreutils';
import { KernelMessage } from '@jupyterlab/services';
import { OutputArea } from '@jupyterlab/outputarea';
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
  notifyOnComplete?: boolean
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
    notifyOnComplete: notifyOnComplete,
  });
  const future = kernelExecutor!.future;
  // TODO fix in upstream jupyterlab if possible...
  (output as any)._onIOPub = future!.onIOPub;
  (output as any)._onExecuteReply = future!.onReply;
  output.future = future!;
  return future?.done;
}
