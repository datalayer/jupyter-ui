/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A JupyterLab kernel connection as the port marimo's kernel bridge needs.
 *
 * @module marimo/kernelPort
 */

import type { Kernel } from '@jupyterlab/services';
import type { KernelComm, KernelPort } from './bundle/index';

/** The kernel connection as a {@link KernelPort}. */
export function kernelPort(connection: Kernel.IKernelConnection): KernelPort {
  return {
    async execute(code: string): Promise<void> {
      const future = connection.requestExecute(
        { code, silent: true, store_history: false, stop_on_error: false },
        false
      );
      let failure: string | undefined;
      future.onIOPub = message => {
        const type = message.header.msg_type;
        if (type === 'error') {
          const content = message.content as {
            ename?: string;
            evalue?: string;
          };
          failure = `${content.ename ?? 'Error'}: ${content.evalue ?? ''}`;
        }
      };
      const reply = await future.done;
      if (reply.content.status === 'error') {
        const content = reply.content as { ename?: string; evalue?: string };
        throw new Error(
          failure ?? `${content.ename ?? 'Error'}: ${content.evalue ?? ''}`
        );
      }
      if (failure) {
        throw new Error(failure);
      }
    },

    async openComm(target: string): Promise<KernelComm> {
      const comm = connection.createComm(target);
      const handlers: Array<(data: Record<string, unknown>) => void> = [];
      const closers: Array<() => void> = [];
      comm.onMsg = message => {
        const data = message.content.data as Record<string, unknown>;
        for (const handler of handlers) {
          handler(data);
        }
      };
      comm.onClose = () => {
        for (const closer of closers) {
          closer();
        }
      };
      // A comm_open has no reply to wait for; the host answers on the comm.
      comm.open({});
      return {
        send: data => {
          comm.send(data as never);
        },
        onMessage: handler => {
          handlers.push(handler);
        },
        onClose: handler => {
          closers.push(handler);
        },
        close: () => {
          if (!comm.isDisposed) {
            comm.close();
          }
        },
      };
    },

    async interrupt(): Promise<void> {
      await connection.interrupt();
    },
  };
}
