/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * KaTeX equations, as a Lexical extension.
 *
 * Registers `EquationNode` and answers `INSERT_EQUATION_COMMAND` by inserting
 * one at the selection, wrapped in a paragraph when it would otherwise land
 * at the root.
 *
 * @module extensions/EquationsExtension
 */

import { $wrapNodeInElement } from '@lexical/utils';
import {
  $createParagraphNode,
  $insertNodes,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { $createEquationNode, EquationNode } from '../nodes/EquationNode';

export type InsertEquationPayload = {
  equation: string;
  inline: boolean;
};

export const INSERT_EQUATION_COMMAND: LexicalCommand<InsertEquationPayload> =
  createCommand('INSERT_EQUATION_COMMAND');

/**
 * Handle `INSERT_EQUATION_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerEquations(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([EquationNode])) {
    throw new Error('EquationsPlugins: EquationsNode not registered on editor');
  }
  return editor.registerCommand<InsertEquationPayload>(
    INSERT_EQUATION_COMMAND,
    payload => {
      const { equation, inline } = payload;
      const equationNode = $createEquationNode(equation, inline);
      $insertNodes([equationNode]);
      if ($isRootOrShadowRoot(equationNode.getParentOrThrow())) {
        $wrapNodeInElement(equationNode, $createParagraphNode).selectEnd();
      }
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const EquationsExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Equations',
  nodes: () => [EquationNode],
  register: registerEquations,
});
