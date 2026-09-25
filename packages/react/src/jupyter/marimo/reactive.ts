/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Marimo's reactivity over the Jupyter protocol.
 *
 * Marimo works its dataflow graph out from the cells' source: a cell defines
 * names and refers to names, and running one re-runs every cell that,
 * transitively, refers to what it defined. That graph lives in the kernel
 * (Marimo's `compile_cell` and `DirectedGraph`), installed by one execute
 * request and asked through further ones, so nothing here needs Marimo's own
 * server and every component keeps talking to the kernel it already had.
 *
 * One `MarimoReactive` per kernel connection: the cells of a notebook, the
 * `Cell` components on a page, the outputs of a document all share it as
 * long as they share the kernel, which is what makes them react to each
 * other. Each registers the code it holds and a *runner* — how to run itself
 * again — and `react(cellId)` runs the dependents through their runners.
 *
 * The kernel-side helper source is the one `code-sandboxes` ships
 * (`code_sandboxes/marimo_reactive.py`), verbatim; keep the two identical.
 *
 * @module jupyter/marimo/reactive
 */

import type {
  Kernel as JupyterKernel,
  KernelMessage,
} from '@jupyterlab/services';

/** The name the helper is bound to in the kernel. */
export const HELPER_NAME = '__marimo_reactive__';

/** What an answer line starts with on stdout. */
export const ANSWER_MARKER = '__MARIMO__';

/** What the graph says about a registered cell. */
export type MarimoRegistration = {
  cell: string;
  /** Names the cell defines. */
  defs?: string[];
  /** Names the cell refers to. */
  refs?: string[];
  /** Names this cell defines that another cell defines too. */
  conflicts?: string[];
  /** Whether the cell is part of a dependency cycle. */
  cycle?: boolean;
  /** Set when the source does not parse; the cell is then not in the graph. */
  error?: string;
};

/** The graph as data. */
export type MarimoGraph = {
  cells: Record<
    string,
    { defs: string[]; refs: string[]; parents: string[]; children: string[] }
  >;
  conflicts: string[];
  cycles: string[];
};

/** How a registered cell runs itself again, without reacting further. */
export type MarimoRunner = () => Promise<unknown>;

export const KERNEL_HELPER_SOURCE = `
import base64 as _marimo_b64
import json as _marimo_json


class _MarimoReactive:
    """A reactive cell graph, Marimo's, kept beside the kernel's namespace."""

    def __init__(self):
        from marimo._runtime.dataflow import DirectedGraph

        self._graph = DirectedGraph()
        self._code = {}

    # -- cells -----------------------------------------------------------

    def register(self, cell_id, code):
        """Compile one cell and put it in the graph, replacing its old self."""
        from marimo._ast.compiler import compile_cell

        if cell_id in self._code:
            self._graph.delete_cell(cell_id)
            del self._code[cell_id]
        try:
            cell = compile_cell(code, cell_id=cell_id)
        except SyntaxError as error:
            return {
                "cell": cell_id,
                "error": "SyntaxError: %s (line %s)" % (error.msg, error.lineno),
            }
        self._graph.register_cell(cell_id, cell)
        self._code[cell_id] = code
        return {
            "cell": cell_id,
            "defs": sorted(cell.defs),
            "refs": sorted(cell.refs),
            "conflicts": self._conflicts(cell_id),
            "cycle": self._in_cycle(cell_id),
        }

    def remove(self, cell_id):
        if cell_id in self._code:
            self._graph.delete_cell(cell_id)
            del self._code[cell_id]
        return {"cell": cell_id, "removed": True}

    def code(self, cell_id):
        return self._code.get(cell_id)

    # -- what to run -----------------------------------------------------

    def plan(self, cell_id):
        """The cells to re-run after \`cell_id\` ran, in dependency order."""
        from marimo._runtime.dataflow import topological_sort

        if cell_id not in self._code:
            return []
        return list(topological_sort(self._graph, list(self._graph.descendants(cell_id))))

    def plan_all(self):
        """Every registered cell, in dependency order: a run-all."""
        from marimo._runtime.dataflow import topological_sort

        return list(topological_sort(self._graph, list(self._code)))

    def snapshot(self):
        """The graph as data: each cell's names and neighbours, and what is wrong."""
        cells = {}
        for cell_id in self._code:
            cell = self._graph.cells[cell_id]
            cells[cell_id] = {
                "defs": sorted(cell.defs),
                "refs": sorted(cell.refs),
                "parents": sorted(self._graph.parents.get(cell_id, ())),
                "children": sorted(self._graph.children.get(cell_id, ())),
            }
        return {
            "cells": cells,
            "conflicts": sorted(self._graph.get_multiply_defined()),
            "cycles": sorted(self._cycle_cells()),
        }

    # -- diagnostics -----------------------------------------------------

    def _conflicts(self, cell_id):
        defs = self._graph.cells[cell_id].defs
        return sorted(name for name in self._graph.get_multiply_defined() if name in defs)

    def _cycle_cells(self):
        cells = set()
        for cycle in self._graph.cycles:
            for edge in cycle:
                if isinstance(edge, (tuple, list)):
                    cells.update(edge)
                else:
                    cells.add(edge)
        return cells

    def _in_cycle(self, cell_id):
        return cell_id in self._cycle_cells()

    # -- the wire --------------------------------------------------------

    def answer(self, method, *args):
        """Print one method's result as a marked base64 JSON line."""
        payload = _marimo_json.dumps(getattr(self, method)(*args))
        print("__MARIMO__" + _marimo_b64.b64encode(payload.encode("utf-8")).decode("ascii"))


if "__marimo_reactive__" not in globals():
    __marimo_reactive__ = _MarimoReactive()
`;

const registry = new WeakMap<JupyterKernel.IKernelConnection, MarimoReactive>();

/** A Python literal for one argument of a question. */
const literal = (value: unknown): string => {
  if (typeof value === 'string') {
    // JSON's escaping is Python's, for a double-quoted string.
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(literal).join(', ')}]`;
  }
  return String(value);
};

export class MarimoReactive {
  private _connection: JupyterKernel.IKernelConnection;
  private _ready?: Promise<void>;
  private _codes = new Map<string, string>();
  private _runners = new Map<string, MarimoRunner>();
  private _reacting = false;

  private constructor(connection: JupyterKernel.IKernelConnection) {
    this._connection = connection;
  }

  /** The graph of one kernel connection; made on first use. */
  static for(connection: JupyterKernel.IKernelConnection): MarimoReactive {
    let reactive = registry.get(connection);
    if (!reactive) {
      reactive = new MarimoReactive(connection);
      registry.set(connection, reactive);
    }
    return reactive;
  }

  /** Whether a graph was already made for this connection. */
  static has(connection: JupyterKernel.IKernelConnection): boolean {
    return registry.has(connection);
  }

  /** Whether dependents are being re-run right now. */
  get reacting(): boolean {
    return this._reacting;
  }

  /** The source of every registered cell, by id. */
  get codes(): ReadonlyMap<string, string> {
    return this._codes;
  }

  /**
   * Put the helper in the kernel, once. A kernel restart forgets it, so the
   * promise is dropped when a question finds the helper gone.
   */
  ensure(): Promise<void> {
    if (!this._ready) {
      this._ready = this.run(KERNEL_HELPER_SOURCE).then(reply => {
        if (reply.content.status !== 'ok') {
          this._ready = undefined;
          const content = reply.content as KernelMessage.IReplyErrorContent;
          throw new Error(
            `Marimo's reactive graph could not start in the kernel: ${content.ename}: ${content.evalue}`
          );
        }
      });
    }
    return this._ready;
  }

  /** Register a cell's source; answers its names, or its parse error. */
  async register(cellId: string, code: string): Promise<MarimoRegistration> {
    const answer = (await this.ask(
      'register',
      cellId,
      code
    )) as MarimoRegistration;
    if (answer.error) {
      this._codes.delete(cellId);
    } else {
      this._codes.set(cellId, code);
    }
    return answer;
  }

  /** Forget a cell: nothing reacts to it, and it reacts to nothing. */
  async remove(cellId: string): Promise<void> {
    this._codes.delete(cellId);
    this._runners.delete(cellId);
    if (this._ready) {
      await this.ask('remove', cellId);
    }
  }

  /** The cells to re-run after `cellId` ran, in dependency order. */
  async plan(cellId: string): Promise<string[]> {
    return (await this.ask('plan', cellId)) as string[];
  }

  /** Every registered cell, in dependency order. */
  async planAll(): Promise<string[]> {
    return (await this.ask('plan_all')) as string[];
  }

  /** The graph as data. */
  async graph(): Promise<MarimoGraph> {
    return (await this.ask('snapshot')) as MarimoGraph;
  }

  /** How `cellId` runs itself again; what `react` calls. */
  bindRunner(cellId: string, runner: MarimoRunner): void {
    this._runners.set(cellId, runner);
  }

  unbindRunner(cellId: string): void {
    this._runners.delete(cellId);
  }

  /**
   * Run the cells that depend on `cellId`, in order, through their runners.
   *
   * A runner runs its cell alone: reacting while reacting would run a
   * diamond's far corner twice, so the dependents are planned once, here,
   * and `reacting` says so for the duration. Answers the ids that ran.
   */
  async react(cellId: string): Promise<string[]> {
    if (this._reacting) {
      return [];
    }
    this._reacting = true;
    const ran: string[] = [];
    try {
      for (const dependent of await this.plan(cellId)) {
        const runner = this._runners.get(dependent);
        if (!runner) {
          continue;
        }
        await runner();
        ran.push(dependent);
      }
    } finally {
      this._reacting = false;
    }
    return ran;
  }

  /** Ask the helper one thing; the answer is the marked stdout line. */
  private async ask(method: string, ...args: unknown[]): Promise<unknown> {
    await this.ensure();
    const code = `${HELPER_NAME}.answer(${[JSON.stringify(method), ...args.map(literal)].join(', ')})`;
    const lines: string[] = [];
    const reply = await this.run(code, message => {
      if (message.header.msg_type === 'stream') {
        const content = message.content as KernelMessage.IStreamMsg['content'];
        if (content.name === 'stdout') {
          lines.push(...content.text.split('\n'));
        }
      }
    });
    if (reply.content.status !== 'ok') {
      const content = reply.content as KernelMessage.IReplyErrorContent;
      if (content.ename === 'NameError') {
        // The kernel was restarted: the helper is gone, and so is the graph.
        this._ready = undefined;
      }
      throw new Error(
        `Marimo's reactive graph refused ${method}: ${content.ename}: ${content.evalue}`
      );
    }
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index].trim();
      if (line.startsWith(ANSWER_MARKER)) {
        return JSON.parse(atob(line.slice(ANSWER_MARKER.length)));
      }
    }
    throw new Error(`Marimo's reactive graph gave no answer to ${method}.`);
  }

  /** One silent execute request, with its IOPub messages passed on. */
  private run(
    code: string,
    onIOPub?: (message: KernelMessage.IIOPubMessage) => void
  ): Promise<KernelMessage.IExecuteReplyMsg> {
    const future = this._connection.requestExecute({
      code,
      silent: true,
      store_history: false,
      stop_on_error: false,
    });
    if (onIOPub) {
      future.onIOPub = onIOPub;
    }
    return future.done;
  }
}
