/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Columns, as a Lexical extension.
 *
 * Registers `LayoutContainerNode` and `LayoutItemNode`, keeps their structure
 * (an item outside a container unwraps, an empty item gets a paragraph, a
 * container with no item goes), lets the arrow keys leave a layout at the
 * edges of the document, and answers `INSERT_LAYOUT_COMMAND` with a grid
 * template such as `1fr 1fr`.
 *
 * @module extensions/LayoutExtension
 */

import {
  $findMatchingParent,
  $insertNodeToNearestRoot,
  mergeRegister,
} from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  defineExtension,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  type ElementNode,
  type LexicalCommand,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import {
  $createLayoutContainerNode,
  $isLayoutContainerNode,
  LayoutContainerNode,
} from '../nodes/LayoutContainerNode';
import {
  $createLayoutItemNode,
  $isLayoutItemNode,
  LayoutItemNode,
} from '../nodes/LayoutItemNode';

/** Insert a layout; the payload is the grid template, e.g. `1fr 1fr`. */
export const INSERT_LAYOUT_COMMAND: LexicalCommand<string> = createCommand(
  'INSERT_LAYOUT_COMMAND',
);

/** The number of columns a grid template describes. */
export function getItemsCountFromTemplate(template: string): number {
  return template.trim().split(/\s+/).length;
}

/** A grid template of `count` equal columns. */
export function equalColumnsTemplate(count: number): string {
  return Array.from({ length: Math.max(1, count) }, () => '1fr').join(' ');
}

/**
 * Register the layout behaviours on `editor`.
 *
 * @returns The function that removes them again.
 */
export function registerLayout(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([LayoutContainerNode, LayoutItemNode])) {
    throw new Error(
      'LayoutPlugin: LayoutContainerNode, or LayoutItemNode not registered on editor',
    );
  }

  const $onEscape = (before: boolean) => {
    const selection = $getSelection();
    if (
      $isRangeSelection(selection) &&
      selection.isCollapsed() &&
      selection.anchor.offset === 0
    ) {
      const container = $findMatchingParent(
        selection.anchor.getNode(),
        $isLayoutContainerNode,
      );
      if ($isLayoutContainerNode(container)) {
        const parent = container.getParent<ElementNode>();
        const child =
          parent &&
          (before
            ? parent.getFirstChild<LexicalNode>()
            : parent.getLastChild<LexicalNode>());
        const descendant = before
          ? container.getFirstDescendant<LexicalNode>()?.getKey()
          : container.getLastDescendant<LexicalNode>()?.getKey();
        if (
          parent !== null &&
          child === container &&
          selection.anchor.key === descendant
        ) {
          if (before) {
            container.insertBefore($createParagraphNode());
          } else {
            container.insertAfter($createParagraphNode());
          }
        }
      }
    }
    return false;
  };

  return mergeRegister(
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      () => $onEscape(false),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      () => $onEscape(false),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      () => $onEscape(true),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      () => $onEscape(true),
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      INSERT_LAYOUT_COMMAND,
      template => {
        editor.update(() => {
          const container = $createLayoutContainerNode(template);
          for (let i = 0; i < getItemsCountFromTemplate(template); i++) {
            container.append(
              $createLayoutItemNode().append($createParagraphNode()),
            );
          }
          $insertNodeToNearestRoot(container);
          container.selectStart();
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    // Structure: an item lives in a container, a container holds items only,
    // an empty item shows a paragraph to type in.
    editor.registerNodeTransform(LayoutItemNode, node => {
      const parent = node.getParent<ElementNode>();
      if (!$isLayoutContainerNode(parent)) {
        for (const child of node.getChildren<LexicalNode>()) {
          node.insertBefore(child);
        }
        node.remove();
        return;
      }
      if (node.isEmpty()) {
        node.append($createParagraphNode());
      }
    }),
    editor.registerNodeTransform(LayoutContainerNode, node => {
      const children = node.getChildren<LexicalNode>();
      if (!children.every($isLayoutItemNode)) {
        for (const child of children) {
          node.insertBefore(child);
        }
        node.remove();
        return;
      }
      if (children.length === 0) {
        node.remove();
      }
    }),
  );
}

export const LayoutExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Layout',
  nodes: () => [LayoutContainerNode, LayoutItemNode],
  register: registerLayout,
});
