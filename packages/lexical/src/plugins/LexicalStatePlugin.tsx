/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Plugin to initialize LexicalAdapter and register it in the lexicalStore.
 *
 * This plugin:
 * 1. Gets the editor instance from LexicalComposerContext
 * 2. Gets lexicalId and serviceManager from LexicalConfigContext
 * 3. Registers the editor through `registerLexicalState`, the same function
 *    `LexicalStateExtension` uses
 *
 * @module plugins/LexicalStatePlugin
 */

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalConfig } from '../context/LexicalConfigContext';
import { registerLexicalState } from '../extensions/LexicalStateExtension';

/**
 * Plugin that initializes the LexicalAdapter and registers it in the state store.
 *
 * This plugin should be placed inside the composer and wrapped by
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

  useEffect(
    () => registerLexicalState(editor, lexicalId, serviceManager),
    [editor, lexicalId, serviceManager],
  );

  return null;
}
