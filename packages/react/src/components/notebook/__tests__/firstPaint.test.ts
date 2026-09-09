/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * When a notebook counts as painted.
 *
 * The panel object exists before anything is visible, and a shared document
 * can be attached with no cells until its room syncs; the gate must not say
 * "painted" in either state, and must say it once the first cell is ready
 * and drawn, or once a synced model is known to be empty.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { watchFirstPaint, type IPaintedPanel } from '../firstPaint';

/** A signal with connect/disconnect and a way to fire it. */
const signal = () => {
  const slots = new Set<() => void>();
  return {
    connect: (slot: () => void) => slots.add(slot),
    disconnect: (slot: () => void) => slots.delete(slot),
    fire: () => slots.forEach(slot => slot()),
    size: () => slots.size,
  };
};

/** A cell whose readiness the test resolves. */
const cell = () => {
  let resolve!: () => void;
  const ready = new Promise<void>(done => {
    resolve = done;
  });
  return { ready, resolve };
};

/** A panel with the parts the gate reads; frames run on demand. */
const panel = (cells: ReturnType<typeof cell>[], attached = true) => {
  const changed = signal();
  // The list the fake panel reads is the one the test grows.
  const widgets: ReturnType<typeof cell>[] = [...cells];
  const state: IPaintedPanel & {
    changed: typeof changed;
    widgets: typeof widgets;
  } = {
    isAttached: attached,
    widgets,
    content: {
      widgets,
      model: {
        cells: {
          get length() {
            return widgets.length;
          },
          changed,
        },
      },
    },
    changed,
  };
  return state;
};

/** Frames the test advances by hand. */
const frames = () => {
  const queue: (() => void)[] = [];
  return {
    frame: (callback: () => void) => queue.push(callback),
    next: () => queue.shift()?.(),
    pending: () => queue.length,
  };
};

const flush = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('watchFirstPaint', () => {
  it('paints one frame after the first cell is ready on an attached panel', async () => {
    const first = cell();
    const p = panel([first]);
    const f = frames();
    const onPainted = jest.fn();
    watchFirstPaint(p, { synced: true, onPainted, frame: f.frame });

    expect(onPainted).not.toHaveBeenCalled();
    first.resolve();
    await flush();
    // Ready, attached: the frame is what is left.
    expect(onPainted).not.toHaveBeenCalled();
    expect(f.pending()).toBe(1);
    f.next();
    expect(onPainted).toHaveBeenCalledTimes(1);
  });

  it('waits for the panel to be attached before counting the frame', async () => {
    const first = cell();
    const p = panel([first], false);
    const f = frames();
    const onPainted = jest.fn();
    watchFirstPaint(p, { synced: true, onPainted, frame: f.frame });
    first.resolve();
    await flush();
    f.next();
    expect(onPainted).not.toHaveBeenCalled();
    p.isAttached = true;
    f.next();
    f.next();
    expect(onPainted).toHaveBeenCalledTimes(1);
  });

  it('does not take an unsynced shared document with no cells for an empty one', () => {
    const p = panel([]);
    const f = frames();
    const onPainted = jest.fn();
    watchFirstPaint(p, {
      synced: false,
      onPainted,
      frame: f.frame,
      fallbackMs: 60_000,
    });
    f.next();
    expect(onPainted).not.toHaveBeenCalled();
    expect(p.changed.size()).toBe(1);
  });

  it('paints a synced empty notebook without waiting for cells', () => {
    const p = panel([]);
    const f = frames();
    const onPainted = jest.fn();
    watchFirstPaint(p, { synced: true, onPainted, frame: f.frame });
    f.next();
    expect(onPainted).toHaveBeenCalledTimes(1);
  });

  it('follows the cells when they arrive later, and only once', async () => {
    const p = panel([]);
    const f = frames();
    const onPainted = jest.fn();
    watchFirstPaint(p, {
      synced: false,
      onPainted,
      frame: f.frame,
      fallbackMs: 60_000,
    });
    const first = cell();
    p.widgets.push(first);
    p.changed.fire();
    p.changed.fire();
    first.resolve();
    await flush();
    f.next();
    f.next();
    expect(onPainted).toHaveBeenCalledTimes(1);
    // Painted: nothing is listening any more.
    expect(p.changed.size()).toBe(0);
  });

  it('gives up on a signal that never comes, and stops listening once disposed', () => {
    jest.useFakeTimers();
    try {
      const p = panel([]);
      const onPainted = jest.fn();
      watchFirstPaint(p, {
        synced: false,
        onPainted,
        frame: () => {},
        fallbackMs: 500,
      });
      jest.advanceTimersByTime(499);
      expect(onPainted).not.toHaveBeenCalled();
      jest.advanceTimersByTime(1);
      expect(onPainted).toHaveBeenCalledTimes(1);

      const q = panel([]);
      const late = jest.fn();
      const dispose = watchFirstPaint(q, {
        synced: false,
        onPainted: late,
        frame: () => {},
        fallbackMs: 500,
      });
      dispose();
      jest.advanceTimersByTime(1000);
      expect(late).not.toHaveBeenCalled();
      expect(q.changed.size()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
