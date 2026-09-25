/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Horizontal rules, as a Lexical extension.
 *
 * Registers the React `HorizontalRuleNode` — the class the markdown
 * transformers and the block tools create — and answers
 * `INSERT_HORIZONTAL_RULE_COMMAND` by opening a new paragraph and placing the
 * rule above it, so the caret lands on an editable line below the rule.
 *
 * @module extensions/HorizontalRuleExtension
 */

import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  defineExtension,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {
  $createHorizontalRuleNode,
  HorizontalRuleNode,
  INSERT_HORIZONTAL_RULE_COMMAND,
} from '@lexical/react/LexicalHorizontalRuleNode';

/**
 * Handle `INSERT_HORIZONTAL_RULE_COMMAND` on `editor`.
 *
 * @returns The function that removes the handler again.
 */
export function registerHorizontalRule(editor: LexicalEditor): () => void {
  return editor.registerCommand(
    INSERT_HORIZONTAL_RULE_COMMAND,
    () => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) {
        return false;
      }
      const focusNode = selection.focus.getNode();
      if (focusNode !== null) {
        const horizontalRuleNode =
          $createHorizontalRuleNode() as unknown as LexicalNode;
        selection.insertParagraph();
        selection.focus
          .getNode()
          .getTopLevelElementOrThrow()
          .insertBefore(horizontalRuleNode);
      }
      return true;
    },
    COMMAND_PRIORITY_EDITOR,
  );
}

export const HorizontalRuleExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/HorizontalRule',
  nodes: () => [HorizontalRuleNode],
  register: registerHorizontalRule,
});
