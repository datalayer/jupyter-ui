/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * When a notebook panel has actually put its cells on screen.
 *
 * A panel object exists long before anything is visible: it is created, then
 * attached to the DOM, and only then do its cells render — and a
 * collaborative document can be attached with no cells at all until the room
 * has synced. Taking the loading state down when the panel exists therefore
 * shows a blank; this is the condition that replaces it.
 *
 * Painted means one of:
 *
 * - the first cell widget reports `ready` and the panel is attached — a frame
 *   later, so the browser has drawn it;
 * - the model is synced with its source and has no cells: an empty notebook
 *   has nothing to wait for. `synced` is the caller's word, because a shared
 *   document that has not synced yet also has no cells, and is not empty;
 * - a fallback, after `fallbackMs`: a room that never syncs, or a widget that
 *   never reports, must not hold the skeleton up for ever. This is a safety
 *   net, not the condition.
 *
 * Framed as a plain function over the parts of a panel it reads, so it can
 * be tested with a fake panel and so the effect that uses it stays thin.
 *
 * @module components/notebook/firstPaint
 */

/** The parts of a cell widget this reads. */
export interface IPaintedCell {
  ready: Promise<void>;
}

/** The parts of a cells list this reads: its length, and a change signal. */
export interface IPaintedCells {
  length: number;
  changed: {
    connect(slot: () => void): unknown;
    disconnect(slot: () => void): unknown;
  };
}

/** The parts of a notebook panel this reads. */
export interface IPaintedPanel {
  isAttached: boolean;
  content: {
    widgets: ReadonlyArray<IPaintedCell>;
    model: { cells: IPaintedCells } | null;
  };
}

export interface IWatchFirstPaintOptions {
  /** Whether the model has its content from its source; true for a local one. */
  synced: boolean;
  /** How long to wait before giving up on a signal that never comes. */
  fallbackMs?: number;
  /** Told once, when the cells are on screen — or the fallback fires. */
  onPainted: () => void;
  /** The frame scheduler, for tests; `requestAnimationFrame` by default. */
  frame?: (callback: () => void) => void;
}

const DEFAULT_FALLBACK_MS = 15_000;

const defaultFrame = (callback: () => void): void => {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => callback());
  } else {
    setTimeout(callback, 16);
  }
};

/**
 * Watch a panel until its cells are on screen; returns the disposer.
 *
 * Idempotent on the callback: `onPainted` runs at most once, whichever of
 * the three ways gets there first, and never after `dispose`.
 */
export function watchFirstPaint(
  panel: IPaintedPanel,
  options: IWatchFirstPaintOptions
): () => void {
  const { synced, fallbackMs = DEFAULT_FALLBACK_MS, onPainted } = options;
  const frame = options.frame ?? defaultFrame;
  let done = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cells = panel.content.model?.cells ?? null;

  const settle = () => {
    if (done) {
      return;
    }
    done = true;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (cells) {
      cells.changed.disconnect(onCellsChanged);
    }
    onPainted();
  };

  /*
   * One frame after the cell is ready and the panel attached: `ready` says
   * the widget has its editor, attachment says it is in the document, and
   * the frame is the browser drawing both.
   */
  const settleOnceDrawn = () => {
    const tick = () => {
      if (done) {
        return;
      }
      if (panel.isAttached) {
        frame(settle);
      } else {
        frame(tick);
      }
    };
    tick();
  };

  const awaitFirstCell = (): boolean => {
    const first = panel.content.widgets[0];
    if (!first) {
      return false;
    }
    void first.ready.then(settleOnceDrawn);
    return true;
  };

  const onCellsChanged = () => {
    if (!done) {
      awaitFirstCell();
    }
  };

  if (!awaitFirstCell()) {
    if (synced && (!cells || cells.length === 0)) {
      // Empty, and known to be: nothing will arrive.
      settleOnceDrawn();
    } else if (cells) {
      // Cells on their way — a syncing room, a late populate.
      cells.changed.connect(onCellsChanged);
    }
  }

  if (!done) {
    timer = setTimeout(settle, fallbackMs);
  }

  return () => {
    done = true;
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    if (cells) {
      cells.changed.disconnect(onCellsChanged);
    }
  };
}
