/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Running the variables snippet on a kernel connection, quietly.
 *
 * The request is `silent` and leaves the history alone (`store_history:
 * false`): ipykernel then neither counts it nor broadcasts its input, so the
 * notebook's execution count does not move. What the snippet prints still
 * comes back on IOPub, addressed to this request only. A kernel that ignores
 * `silent` — Pyodide's — still answers; it may count the request.
 *
 * @module components/kernel/variables/execution
 */

import type { Kernel, KernelMessage } from '@jupyterlab/services';
import type {
  KernelVariablesExecution,
  KernelVariablesExecutor,
} from './introspection';

/** Run code silently on a connection and gather what it printed. */
export async function executeSilently(
  connection: Kernel.IKernelConnection,
  code: string,
  onSent?: (msgId: string) => void
): Promise<KernelVariablesExecution> {
  const future = connection.requestExecute(
    {
      code,
      silent: true,
      store_history: false,
      stop_on_error: false,
      allow_stdin: false,
    },
    true
  );
  onSent?.(future.msg.header.msg_id);
  const stdout: string[] = [];
  let error: string | undefined;
  future.onIOPub = (message: KernelMessage.IIOPubMessage) => {
    const type = message.header.msg_type;
    if (type === 'stream') {
      const content = message.content as KernelMessage.IStreamMsg['content'];
      if (content.name === 'stdout') {
        stdout.push(content.text);
      }
    } else if (type === 'error') {
      const content = message.content as KernelMessage.IErrorMsg['content'];
      error = `${content.ename}: ${content.evalue}`;
    }
  };
  const reply = (await future.done) as KernelMessage.IExecuteReplyMsg;
  if (!error && reply?.content?.status === 'error') {
    const content = reply.content as KernelMessage.IReplyErrorContent;
    error = `${content.ename}: ${content.evalue}`;
  }
  return { stdout: stdout.join(''), error };
}

/** An executor on a kernel connection, for {@link listKernelVariables}. */
export function kernelConnectionExecutor(
  connection: Kernel.IKernelConnection,
  onSent?: (msgId: string) => void
): KernelVariablesExecutor {
  return code => executeSilently(connection, code, onSent);
}
