/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The reactive graph speaks to the kernel the way the kernel-side helper
 * expects: one bootstrap, questions as `__marimo_reactive__.answer(...)`,
 * answers as a marked base64 line — and runs dependents in the order the
 * kernel gives, once, however the runners themselves would react.
 */

import { describe, expect, it } from '@jest/globals';
import type {
  Kernel as JupyterKernel,
  KernelMessage,
} from '@jupyterlab/services';
import {
  ANSWER_MARKER,
  HELPER_NAME,
  KERNEL_HELPER_SOURCE,
  MarimoReactive,
} from '../reactive';

type Answer = (method: string, args: unknown[]) => unknown;

/** A kernel connection that answers the helper's questions from a table. */
function fakeConnection(answer: Answer, options: { fail?: RegExp } = {}) {
  const sent: string[] = [];
  const connection = {
    requestExecute(content: KernelMessage.IExecuteRequestMsg['content']) {
      sent.push(content.code);
      let onIOPub: ((message: KernelMessage.IIOPubMessage) => void) | undefined;
      const future = {
        set onIOPub(handler: (message: KernelMessage.IIOPubMessage) => void) {
          onIOPub = handler;
        },
        get done() {
          return new Promise(resolve => {
            setTimeout(() => {
              const code = content.code;
              if (options.fail?.test(code)) {
                resolve({
                  content: {
                    status: 'error',
                    ename: 'NameError',
                    evalue: `name '${HELPER_NAME}' is not defined`,
                  },
                });
                return;
              }
              const question = code.match(/\.answer\((.*)\)$/s);
              if (question) {
                const [method, ...args] = JSON.parse(`[${question[1]}]`) as [
                  string,
                  ...unknown[],
                ];
                const payload = JSON.stringify(answer(method, args));
                onIOPub?.({
                  header: { msg_type: 'stream' },
                  content: {
                    name: 'stdout',
                    text: `noise\n${ANSWER_MARKER}${btoa(payload)}\n`,
                  },
                } as unknown as KernelMessage.IIOPubMessage);
              }
              resolve({ content: { status: 'ok' } });
            }, 0);
          });
        },
      };
      return future;
    },
  };
  return {
    connection: connection as unknown as JupyterKernel.IKernelConnection,
    sent,
  };
}

describe('MarimoReactive', () => {
  it('is one per connection', () => {
    const { connection } = fakeConnection(() => null);
    expect(MarimoReactive.for(connection)).toBe(MarimoReactive.for(connection));
    expect(MarimoReactive.has(connection)).toBe(true);
  });

  it('installs the helper once, then asks its questions as marked answers', async () => {
    const { connection, sent } = fakeConnection((method, args) =>
      method === 'register'
        ? { cell: args[0], defs: ['x'], refs: [] }
        : method === 'plan'
          ? ['b', 'c']
          : null
    );
    const reactive = MarimoReactive.for(connection);
    const registration = await reactive.register('a', 'x = 1\nprint("hi")');
    expect(registration).toEqual({ cell: 'a', defs: ['x'], refs: [] });
    expect(await reactive.plan('a')).toEqual(['b', 'c']);
    // The bootstrap went first, and only once.
    expect(sent.filter(code => code === KERNEL_HELPER_SOURCE)).toHaveLength(1);
    expect(sent[1]).toBe(
      `${HELPER_NAME}.answer("register", "a", "x = 1\\nprint(\\"hi\\")")`
    );
    expect(sent[2]).toBe(`${HELPER_NAME}.answer("plan", "a")`);
    expect(reactive.codes.get('a')).toBe('x = 1\nprint("hi")');
  });

  it('runs the dependents the kernel names, in order, and only once', async () => {
    const { connection } = fakeConnection((method, args) =>
      method === 'plan'
        ? args[0] === 'a'
          ? ['b', 'c']
          : ['c']
        : { cell: args[0] }
    );
    const reactive = MarimoReactive.for(connection);
    const ran: string[] = [];
    for (const id of ['b', 'c']) {
      reactive.bindRunner(id, async () => {
        ran.push(id);
        expect(reactive.reacting).toBe(true);
        // A dependent that reacts on its own would run c twice: it must not.
        expect(await reactive.react(id)).toEqual([]);
      });
    }
    expect(await reactive.react('a')).toEqual(['b', 'c']);
    expect(ran).toEqual(['b', 'c']);
    expect(reactive.reacting).toBe(false);
  });

  it('skips a dependent that has no runner and forgets a removed cell', async () => {
    const { connection, sent } = fakeConnection((method, args) =>
      method === 'plan' ? ['gone', 'here'] : { cell: args[0] }
    );
    const reactive = MarimoReactive.for(connection);
    const ran: string[] = [];
    reactive.bindRunner('here', async () => {
      ran.push('here');
    });
    await reactive.register('gone', 'y = 1');
    await reactive.remove('gone');
    expect(reactive.codes.has('gone')).toBe(false);
    expect(sent.at(-1)).toBe(`${HELPER_NAME}.answer("remove", "gone")`);
    expect(await reactive.react('a')).toEqual(['here']);
    expect(ran).toEqual(['here']);
  });

  it('installs the helper again after a kernel restart forgot it', async () => {
    const { connection, sent } = fakeConnection(
      (method, args) => ({ cell: args[0] }),
      {
        fail: new RegExp(`^${HELPER_NAME}\\.answer(?=.*)`),
      }
    );
    const reactive = MarimoReactive.for(connection);
    // The first question finds no helper: the kernel restarted.
    await expect(reactive.register('a', 'x = 1')).rejects.toThrow('NameError');
    (connection as unknown as { requestExecute: unknown }).requestExecute =
      fakeConnection((method, args) => ({
        cell: args[0],
      })).connection.requestExecute;
    await reactive.register('a', 'x = 1');
    // Two bootstraps: the second because the first was found gone.
    expect(sent.filter(code => code === KERNEL_HELPER_SOURCE)).toHaveLength(1);
  });
});
