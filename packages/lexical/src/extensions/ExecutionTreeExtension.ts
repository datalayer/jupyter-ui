/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Execution trees, as a Lexical extension.
 *
 * Registers `ExecutionTreeNode` and answers `INSERT_EXECUTION_TREE_COMMAND`
 * (payload: the execution id) by inserting one at the nearest root.
 *
 * @module extensions/ExecutionTreeExtension
 */

import { $insertNodeToNearestRoot } from '@lexical/utils';
import {
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import {
  $createExecutionTreeNode,
  ExecutionTreeNode,
} from '../nodes/ExecutionTreeNode';

export const INSERT_EXECUTION_TREE_COMMAND: LexicalCommand<string> =
  createCommand('INSERT_EXECUTION_TREE_COMMAND');

/**
 * Handle `INSERT_EXECUTION_TREE_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerExecutionTree(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([ExecutionTreeNode])) {
    throw new Error(
      'ExecutionTreeExtension: ExecutionTreeNode not registered on editor',
    );
  }
  return editor.registerCommand<string>(
    INSERT_EXECUTION_TREE_COMMAND,
    executionId => {
      $insertNodeToNearestRoot($createExecutionTreeNode(executionId));
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const ExecutionTreeExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/ExecutionTree',
  nodes: () => [ExecutionTreeNode],
  register: registerExecutionTree,
});
