/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tools a plugin brings with it.
 *
 * The tools in `tools/definitions` are the ones every Lexical document has,
 * because every Lexical document has blocks. A plugin's tools are not like
 * that: `excalidrawAddElements` is meaningless in an editor that never
 * registered `ExcalidrawNode`, and offering it there is worse than not
 * offering it at all — the model spends a call finding out, and the failure
 * looks like a broken tool rather than an absent feature.
 *
 * So a plugin contributes its tools by mounting, and takes them away by
 * unmounting. What it contributes is three things that travel together:
 *
 * - `definitions`, which is what the model is told exists;
 * - `operations`, the platform-agnostic half, which validate their parameters
 *   and hand them to the executor — these run wherever the agent runs, which
 *   may be Node, so they must not import the editor;
 * - `handlers`, the browser half, which actually touch the document.
 *
 * The split is the same one the core tools already make between
 * `tools/operations` and the methods on `LexicalState`. The difference is
 * only that a plugin's handlers cannot live on the store, because the store
 * does not know which plugins exist.
 *
 * @module tools/core/pluginTools
 */

import type { ToolDefinition } from '@datalayer/jupyter-react';
import type { ToolOperation } from './interfaces';

/**
 * The browser-side half of a plugin's tool: the part that touches the editor.
 *
 * Handed the adapter for the document the tool was called on, so it can reach
 * the editor through `adapter.editor` and reuse the adapter's own block
 * operations where they fit.
 *
 * `args` arrives already validated by the operation, minus the document id
 * the executor used to find the adapter.
 */
export type LexicalToolHandler = (
  /** The document the call is about. Typed loosely to keep this module free
   *  of the editor: the concrete type is `LexicalAdapter`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: any,
  args: Record<string, unknown>,
) => Promise<unknown>;

/**
 * Everything a plugin contributes while it is mounted.
 */
export interface LexicalPluginTools {
  /**
   * What the plugin is called.
   *
   * Doubles as the registration key, so mounting the same plugin twice on one
   * document contributes one set of tools rather than two.
   */
  name: string;

  /** What the model is told exists. */
  definitions: ToolDefinition[];

  /**
   * The agent-facing operations, keyed by `ToolDefinition.operation`.
   *
   * Every definition's `operation` must have an entry here, or the tool is
   * advertised and cannot be called.
   */
  operations: Record<string, ToolOperation<unknown, unknown>>;

  /**
   * The browser-side implementations, keyed by the same operation names.
   *
   * Looked up by the executor before it falls back to the store's own
   * methods, which is what lets a plugin add a tool without the store
   * learning anything about it.
   */
  handlers: Record<string, LexicalToolHandler>;
}

/**
 * A set of tool definitions and the operations that run them.
 *
 * What a consumer needs in order to register tools with an agent: the core
 * ones plus whatever the mounted plugins have contributed.
 */
export interface LexicalToolBundle {
  definitions: ToolDefinition[];
  operations: Record<string, ToolOperation<unknown, unknown>>;
}
