/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Plugin to initialize LexicalAdapter and register it in the lexicalStore.
 *
 * This plugin:
 * 1. Gets the editor instance from LexicalComposerContext
 * 2. Gets lexicalId and serviceManager from LexicalConfigContext
 * 3. Creates a LexicalAdapter
 * 4. Registers the adapter in the global lexicalStore
 *
 * @module plugins/LexicalStatePlugin
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalConfig } from '../context/LexicalConfigContext';
import { LexicalAdapter } from '../state/LexicalAdapter';
import { lexicalStore } from '../state/LexicalState';

/**
 * Plugin that initializes the LexicalAdapter and registers it in the state store.
 *
 * This plugin should be placed inside the LexicalComposer and wrapped by
 * LexicalConfigProvider which provides lexicalId and serviceManager.
 *
 * @returns null - This is an effect-only plugin
 *
 * @example
 * ```tsx
 * <LexicalConfigProvider lexicalId="doc-123" serviceManager={sm}>
 *   <LexicalComposer initialConfig={config}>
 *     <LexicalStatePlugin />
 *     {/ * other plugins * /}
 *   </LexicalComposer>
 * </LexicalConfigProvider>
 * ```
 */
export function LexicalStatePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const { lexicalId, serviceManager } = useLexicalConfig();

  useEffect(() => {
    // Create adapter with editor and serviceManager
    const adapter = new LexicalAdapter(editor, serviceManager);

    // Register in global store
    const currentLexicals = lexicalStore.getState().lexicals;
    const updatedLexicals = new Map(currentLexicals);
    updatedLexicals.set(lexicalId, { adapter });
    lexicalStore.getState().setLexicals(updatedLexicals);

    // Cleanup on unmount
    return () => {
      const currentLexicals = lexicalStore.getState().lexicals;
      const updatedLexicals = new Map(currentLexicals);
      updatedLexicals.delete(lexicalId);
      lexicalStore.getState().setLexicals(updatedLexicals);
    };
  }, [editor, lexicalId, serviceManager]);

  return null;
}
