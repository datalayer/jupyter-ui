/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A ceiling on list nesting, as a Lexical extension.
 *
 * `INDENT_CONTENT_COMMAND` is refused once a list would go deeper than
 * `maxDepth`. The depth is a signal in the extension's output, so it can be
 * changed on a live editor:
 *
 * ```ts
 * getExtensionDependencyFromEditor(editor, ListMaxIndentLevelExtension)
 *   .output.maxDepth.value = 3;
 * ```
 *
 * @module extensions/ListMaxIndentLevelExtension
 */

import {
  $getListDepth,
  $isListItemNode,
  $isListNode,
  ListExtension,
} from '@lexical/list';
import { effect, namedSignals } from '@lexical/extension';
import {
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  defineExtension,
  INDENT_CONTENT_COMMAND,
  type LexicalEditor,
  type RangeSelection,
  safeCast,
} from 'lexical';

export interface ListMaxIndentLevelConfig {
  /** The deepest list level an indent may reach. */
  maxDepth: number;
}

export const DEFAULT_LIST_MAX_INDENT_LEVEL = 7;

function getElementNodesInSelection(selection: RangeSelection) {
  const nodesInSelection = selection.getNodes();
  if (nodesInSelection.length === 0) {
    return new Set([
      selection.anchor.getNode().getParentOrThrow(),
      selection.focus.getNode().getParentOrThrow(),
    ]);
  }
  return new Set(
    nodesInSelection.map(n => ($isElementNode(n) ? n : n.getParentOrThrow())),
  );
}

function isIndentPermitted(maxDepth: number) {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  const elementNodesInSelection = getElementNodesInSelection(selection);
  let totalDepth = 0;
  for (const elementNode of elementNodesInSelection) {
    if ($isListNode(elementNode)) {
      totalDepth = Math.max($getListDepth(elementNode) + 1, totalDepth);
    } else if ($isListItemNode(elementNode)) {
      const parent = elementNode.getParent();
      if (!$isListNode(parent)) {
        throw new Error(
          'ListMaxIndentLevelPlugin: A ListItemNode must have a ListNode for a parent.',
        );
      }
      totalDepth = Math.max($getListDepth(parent) + 1, totalDepth);
    }
  }
  return totalDepth <= maxDepth;
}

/**
 * Refuse indents past `maxDepth` on `editor`.
 *
 * @returns The function that lifts the ceiling again.
 */
export function registerListMaxIndentLevel(
  editor: LexicalEditor,
  maxDepth: number = DEFAULT_LIST_MAX_INDENT_LEVEL,
): () => void {
  return editor.registerCommand(
    INDENT_CONTENT_COMMAND,
    () => !isIndentPermitted(maxDepth),
    COMMAND_PRIORITY_HIGH,
  );
}

export const ListMaxIndentLevelExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/ListMaxIndentLevel',
  config: safeCast<ListMaxIndentLevelConfig>({
    maxDepth: DEFAULT_LIST_MAX_INDENT_LEVEL,
  }),
  dependencies: [ListExtension],
  build: (_editor, config) => namedSignals(config),
  register: (editor, _config, state) => {
    const { maxDepth } = state.getOutput();
    return effect(() => registerListMaxIndentLevel(editor, maxDepth.value));
  },
});
