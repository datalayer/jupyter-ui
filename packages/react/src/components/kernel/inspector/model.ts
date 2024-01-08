/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { VDomModel } from '@jupyterlab/apputils';
import { Kernel, KernelMessage } from '@jupyterlab/services';

export type MessageThread = {
  args: Kernel.IAnyMessageArgs;
  children: MessageThread[];
};

function isHeader(
  candidate: { [key: string]: undefined } | KernelMessage.IHeader
): candidate is KernelMessage.IHeader {
  return candidate.msg_id !== undefined;
}

/**
 * An iterator class which itterates over the message thread being received
 */
export class ThreadIterator {
  constructor(threads: MessageThread[], collapsed: { [key: string]: boolean }) {
    this._threads = threads;
    this._collapsed = collapsed;
    this._index = -1;
    this._child = null;
  }

  iter() {
    return this;
  }

  [Symbol.iterator]() {
    // iterator returns a javascript object having at least 1 next function
    return {
      next: () => {
        if (this._child) {
          const next = this._child.next();
          // Return the child until it can't be anymore
          if (next !== undefined) {
            return { value: next, done: false };
          }
          // once there are no more children,
          // Start by saying child is null
          this._child = null;
        }
        // Till this point the index hasn't been added
        // Therefore when it first meets this line gets to zero
        // Move to next thread
        ++this._index;
        // Hence when reaching end of the array it exits (done)
        if (this._index >= this._threads.length) {
          return { done: true };
        }
        // A variable to understand which part of the thread we touch first
        // Starting from index 1 then moving ahead
        const entry = this._threads[this._index];
        if (
          entry.children.length > 0 &&
          !this._collapsed[entry.args.msg.header.msg_id]
        ) {
          // If there are children and collapse is false
          // Iterate over it's children
          this._child = new ThreadIterator(entry.children, this._collapsed);
        }
        // But do return the current index position arguments and
        return {
          value: { args: entry.args, hasChildren: entry.children.length > 0 },
          done: false
        };
      }
    };
  }

  // The iteration function
  next(): ThreadIterator.IElement | undefined {
    // if child exists, check if the child has more children.
    if (this._child) {
      const next = this._child.next();
      // Return the child until it can't be anymore
      if (next !== undefined) {
        return next;
      }
      // once there are no more children,
      // Start by saying child is null
      this._child = null;
    }
    // Till this point the index hasn't been added
    // Therefore when it first meets this line gets to zero
    // Move to next thread
    ++this._index;
    // Hence when reaching end of the array it exits (done)
    if (this._index >= this._threads.length) {
      return undefined;
    }
    // A variable to understand which part of the thread we touch first
    // Starting from index 1 then moving ahead
    const entry = this._threads[this._index];
    if (
      entry.children.length > 0 &&
      !this._collapsed[entry.args.msg.header.msg_id]
    ) {
      // If there are children and collapse is false
      // Iterate over it's children
      this._child = new ThreadIterator(entry.children, this._collapsed);
    }
    // But do return the current index position arguments and
    return { args: entry.args, hasChildren: entry.children.length > 0 };
  }

  clone(): ThreadIterator {
    const r = new ThreadIterator(this._threads, this._collapsed);
    r._index = this._index;
    if (this._child) {
      r._child = this._child.clone();
    }
    return r;
  }

  private _index: number;
  private _child: ThreadIterator | null;

  private _threads: MessageThread[];
  private _collapsed: { [key: string]: boolean };
}

export namespace ThreadIterator {
  export interface IElement {
    args: Kernel.IAnyMessageArgs;
    hasChildren: boolean;
  }
}

/**
 * Model for a kernel spy.
 */
export class KernelSpyModel extends VDomModel {
  constructor(kernel?: Kernel.IKernelConnection | null) {
    super();
    this.kernel = kernel ?? null;
  }

  clear() {
    this._log.splice(0, this._log.length);
    this._messages = {};
    this._childLUT = {};
    this._roots = [];
    this.stateChanged.emit(void 0);
  }

  get kernel() {
    return this._kernel;
  }

  set kernel(value: Kernel.IKernelConnection | null) {
    if (this._kernel) {
      this._kernel.anyMessage.disconnect(this.onMessage, this);
    }
    this._kernel = value;
    if (this._kernel) {
      this._kernel.anyMessage.connect(this.onMessage, this);
    }
  }

  get log(): ReadonlyArray<Kernel.IAnyMessageArgs> {
    return this._log;
  }

  get tree(): MessageThread[] {
    return this._roots.map(rootId => {
      return this.getThread(rootId, false);
    });
  }

  depth(args: Kernel.IAnyMessageArgs | null): number {
    if (args === null) {
      return -1;
    }
    let depth = 0;
    while ((args = this._findParent(args))) {
      ++depth;
    }
    return depth;
  }

  getThread(msgId: string, ancestors = true): MessageThread {
    const args = this._messages[msgId];
    if (ancestors) {
      // Work up to root, then work downwards
      let root = args;
      let candidate;
      while ((candidate = this._findParent(root))) {
        root = candidate;
      }
      return this.getThread(root.msg.header.msg_id, false);
    }

    const childMessages = this._childLUT[msgId] || [];
    const childThreads = childMessages.map(childId => {
      return this.getThread(childId, false);
    });
    const thread: MessageThread = {
      args: this._messages[msgId],
      children: childThreads
    };
    return thread;
  }

  protected onMessage(
    sender: Kernel.IKernelConnection,
    args: Kernel.IAnyMessageArgs
  ) {
    const { msg } = args;
    this._log.push(args);
    this._messages[msg.header.msg_id] = args;
    const parent = this._findParent(args);
    if (parent === null) {
      this._roots.push(msg.header.msg_id);
    } else {
      const header = parent.msg.header;
      this._childLUT[header.msg_id] = this._childLUT[header.msg_id] || [];
      this._childLUT[header.msg_id].push(msg.header.msg_id);
    }
    this.stateChanged.emit(undefined);
  }

  private _findParent(
    args: Kernel.IAnyMessageArgs
  ): Kernel.IAnyMessageArgs | null {
    if (isHeader(args.msg.parent_header)) {
      return this._messages[args.msg.parent_header.msg_id] || null;
    }
    return null;
  }

  private _log: Kernel.IAnyMessageArgs[] = [];

  private _kernel: Kernel.IKernelConnection | null = null;

  private _messages: { [key: string]: Kernel.IAnyMessageArgs } = {};
  private _childLUT: { [key: string]: string[] } = {};
  private _roots: string[] = [];
}
