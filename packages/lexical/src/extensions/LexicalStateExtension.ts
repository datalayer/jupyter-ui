/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The editor's place in the shared `lexicalStore`, as a Lexical extension.
 *
 * An editor an agent can address is registered in the store under its
 * `lexicalId`, wrapped in a `LexicalAdapter` that also carries the service
 * manager used to run its code. Both are signals in the extension's output,
 * so a host that learns them late — a document whose runtime starts after the
 * editor is on screen — sets them on the live editor instead of rebuilding it:
 *
 * ```ts
 * const { lexicalId, serviceManager } = getExtensionDependencyFromEditor(
 *   editor,
 *   LexicalStateExtension,
 * ).output;
 * serviceManager.value = manager;
 * ```
 *
 * Without a `lexicalId` the extension does nothing: an editor mounted without
 * one is not addressable, so there is nothing to register. That keeps the
 * extension safe to include in any editor. `LexicalStatePlugin` is the React
 * form of the same thing, fed from `LexicalConfigContext`.
 *
 * @module extensions/LexicalStateExtension
 */

import { effect, namedSignals } from '@lexical/extension';
import type { ServiceManager } from '@jupyterlab/services';
import { defineExtension, safeCast, type LexicalEditor } from 'lexical';
import { LexicalAdapter } from '../state/LexicalAdapter';
import { lexicalStore } from '../state/LexicalState';

export interface LexicalStateConfig {
  /** The id the editor is registered under; none means not registered. */
  lexicalId: string | null;
  /** The service manager the adapter runs code with. */
  serviceManager: ServiceManager.IManager | undefined;
}

/**
 * Put `editor` in the store under `lexicalId`.
 *
 * @returns The function that takes it out again.
 */
export function registerLexicalState(
  editor: LexicalEditor,
  lexicalId: string,
  serviceManager?: ServiceManager.IManager,
): () => void {
  const adapter = new LexicalAdapter(editor, serviceManager);
  const lexicals = new Map(lexicalStore.getState().lexicals);
  lexicals.set(lexicalId, { adapter });
  lexicalStore.getState().setLexicals(lexicals);
  return () => {
    const current = new Map(lexicalStore.getState().lexicals);
    current.delete(lexicalId);
    lexicalStore.getState().setLexicals(current);
  };
}

export const LexicalStateExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/LexicalState',
  config: safeCast<LexicalStateConfig>({
    lexicalId: null,
    serviceManager: undefined,
  }),
  build: (_editor, config) => namedSignals(config),
  register: (editor, _config, state) => {
    const { lexicalId, serviceManager } = state.getOutput();
    return effect(() => {
      const id = lexicalId.value;
      if (!id) {
        return;
      }
      return registerLexicalState(editor, id, serviceManager.value);
    });
  },
});
