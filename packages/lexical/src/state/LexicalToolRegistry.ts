/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The tools one Lexical document actually offers.
 *
 * `lexicalToolDefinitions` is the fixed part — reading blocks, writing
 * blocks, running cells — because every Lexical document has blocks. The
 * rest depends on which plugins are mounted, and that is not knowable from a
 * module: two editors on the same page can be composed differently, and the
 * same editor changes as the reader opens and closes things.
 *
 * So the answer is per-document and computed on demand. A plugin registers
 * itself when it mounts (see `ExcalidrawPlugin`), and this is where that
 * shows up.
 *
 * @module state/LexicalToolRegistry
 */

import { useMemo } from 'react';
import { useStore } from 'zustand';

import type {
  LexicalPluginTools,
  LexicalToolBundle,
} from '../tools/core/pluginTools';
import { lexicalToolDefinitions, lexicalToolOperations } from '../tools';
import { lexicalStore, type LexicalState } from './LexicalState';

/**
 * Fold the contributed tools in on top of the core ones.
 */
function merge(contributed: LexicalPluginTools[]): LexicalToolBundle {
  const definitions = [...lexicalToolDefinitions];
  const operations = { ...lexicalToolOperations };
  for (const plugin of contributed) {
    definitions.push(...plugin.definitions);
    Object.assign(operations, plugin.operations);
  }
  return { definitions, operations };
}

/**
 * Everything the document at `lexicalId` can be asked to do, right now.
 *
 * The plain reader, for callers outside React — the document plugin building
 * its contribution to the chat, for instance. It is a snapshot: tools
 * contributed by a plugin that mounts later are not in it, which is why the
 * React callers use the hook below instead.
 */
export function getLexicalTools(lexicalId: string): LexicalToolBundle {
  return merge(lexicalStore.getState().selectPluginTools(lexicalId));
}

/**
 * The same thing, kept up to date.
 *
 * Subscribed to the *names* of the mounted plugins rather than to the store,
 * which is the whole trick. The store changes on every block insertion and
 * every cursor move; a component that subscribed to it would rebuild its
 * tools array on each one, and a new tools array is what used to remount the
 * chat and lose whatever it was saying. The names change only when a plugin
 * mounts or unmounts, which is exactly when the tool list is different.
 */
export function useLexicalToolBundle(lexicalId: string): LexicalToolBundle {
  const pluginKey = useStore(lexicalStore, (state: LexicalState) =>
    state.selectPluginToolsKey(lexicalId),
  );
  return useMemo(
    () => merge(lexicalStore.getState().selectPluginTools(lexicalId)),
    // `pluginKey` is the dependency that matters; `lexicalId` is what it is
    // about. Neither the store nor the tools themselves belong here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lexicalId, pluginKey],
  );
}
