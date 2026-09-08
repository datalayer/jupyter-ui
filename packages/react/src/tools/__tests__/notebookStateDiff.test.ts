/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What an edit answers with.
 *
 * `NotebookAdapter.updateCell` computes a diff of what it changed, and the
 * `updateCell` tool renders that diff back to whoever asked for the edit —
 * which is the only part of "Cell 1 overwritten successfully" a reader can
 * actually check. Between the two, the store method dropped it: it was typed
 * `=> void` and called the adapter without returning, so every edit arrived
 * at the tool as `undefined` and was reported as "no changes detected",
 * whatever it had changed.
 *
 * The operation's own tests use a stand-in executor and so never crossed this
 * seam. This one does — in a DOM, because the store reaches Lumino's widgets
 * on the way in and they touch browser APIs at import time.
 */

import { beforeEach, describe, expect, it } from '@jest/globals';

import { notebookStore } from '../../components/notebook/NotebookState';

/** Just enough adapter: the one method this is about. */
const fakeAdapter = (diff: string) => ({
  updateCell: (index: number, source: string) => {
    calls.push({ index, source });
    return diff;
  },
});

let calls: Array<{ index: number; source: string }> = [];

beforeEach(() => {
  calls = [];
  notebookStore.getState().setNotebooks(new Map());
});

const register = (id: string, adapter: unknown) => {
  const notebooks = new Map(notebookStore.getState().notebooks);
  notebooks.set(id, { adapter } as any);
  notebookStore.getState().setNotebooks(notebooks);
};

describe('updating a cell through the store', () => {
  it("hands back the adapter's diff", () => {
    register('nb', fakeAdapter('- old\n+ new'));

    const diff = notebookStore.getState().updateCell('nb', 1, 'new');

    expect(diff).toBe('- old\n+ new');
    expect(calls).toEqual([{ index: 1, source: 'new' }]);
  });

  it('hands it back when called with an object, as the executor does', () => {
    // `DefaultExecutor` injects the id and calls with a single object; the
    // store unpacks it. Both shapes have to answer the same way.
    register('nb', fakeAdapter('- old\n+ new'));

    const diff = (notebookStore.getState().updateCell as any)({
      id: 'nb',
      index: 1,
      source: 'new',
    });

    expect(diff).toBe('- old\n+ new');
  });

  it('answers with nothing for a notebook it does not have', () => {
    expect(notebookStore.getState().updateCell('missing', 0, 'x')).toBeUndefined();
  });
});
