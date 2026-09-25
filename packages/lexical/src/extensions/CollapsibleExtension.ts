/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Collapsible containers, as a Lexical extension.
 *
 * Registers the container, title and content nodes, keeps their structure
 * (a container is a title followed by a content, or it unwraps), lets the
 * arrow keys leave a container at the edges of the document, sends Enter
 * from the title into the content, and answers `INSERT_COLLAPSIBLE_COMMAND`.
 *
 * @module extensions/CollapsibleExtension
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
  COMMAND_PRIORITY_LOW,
  createCommand,
  defineExtension,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  type LexicalEditor,
} from 'lexical';
import {
  $createCollapsibleContainerNode,
  $isCollapsibleContainerNode,
  CollapsibleContainerNode,
} from '../plugins/CollapsiblePlugin/CollapsibleContainerNode';
import {
  $createCollapsibleContentNode,
  $isCollapsibleContentNode,
  CollapsibleContentNode,
} from '../plugins/CollapsiblePlugin/CollapsibleContentNode';
import {
  $createCollapsibleTitleNode,
  $isCollapsibleTitleNode,
  CollapsibleTitleNode,
} from '../plugins/CollapsiblePlugin/CollapsibleTitleNode';

export const INSERT_COLLAPSIBLE_COMMAND = createCommand<void>(
  'INSERT_COLLAPSIBLE_COMMAND',
);

const $onEscapeUp = () => {
  const selection = $getSelection();
  if (
    $isRangeSelection(selection) &&
    selection.isCollapsed() &&
    selection.anchor.offset === 0
  ) {
    const container = $findMatchingParent(
      selection.anchor.getNode(),
      $isCollapsibleContainerNode,
    );
    if ($isCollapsibleContainerNode(container)) {
      const parent = container.getParent();
      if (
        parent !== null &&
        parent.getFirstChild() === container &&
        selection.anchor.key === container.getFirstDescendant()?.getKey()
      ) {
        container.insertBefore($createParagraphNode());
      }
    }
  }
  return false;
};

const $onEscapeDown = () => {
  const selection = $getSelection();
  if ($isRangeSelection(selection) && selection.isCollapsed()) {
    const container = $findMatchingParent(
      selection.anchor.getNode(),
      $isCollapsibleContainerNode,
    );
    if ($isCollapsibleContainerNode(container)) {
      const parent = container.getParent();
      if (parent !== null && parent.getLastChild() === container) {
        const titleParagraph = container.getFirstDescendant();
        const contentParagraph = container.getLastDescendant();
        if (
          (contentParagraph !== null &&
            selection.anchor.key === contentParagraph.getKey() &&
            selection.anchor.offset ===
              contentParagraph.getTextContentSize()) ||
          (titleParagraph !== null &&
            selection.anchor.key === titleParagraph.getKey() &&
            selection.anchor.offset === titleParagraph.getTextContentSize())
        ) {
          container.insertAfter($createParagraphNode());
        }
      }
    }
  }
  return false;
};

/**
 * Register the collapsible behaviours on `editor`.
 *
 * @returns The function that removes them again.
 */
export function registerCollapsible(editor: LexicalEditor): () => void {
  if (
    !editor.hasNodes([
      CollapsibleContainerNode,
      CollapsibleTitleNode,
      CollapsibleContentNode,
    ])
  ) {
    throw new Error(
      'CollapsiblePlugin: CollapsibleContainerNode, CollapsibleTitleNode, or CollapsibleContentNode not registered on editor',
    );
  }
  return mergeRegister(
    // Structure enforcing transformers for each node type. In case nesting structure is not
    // "Container > Title + Content" it'll unwrap nodes and convert it back
    // to regular content.
    editor.registerNodeTransform(CollapsibleContentNode, node => {
      const parent = node.getParent();
      if (!$isCollapsibleContainerNode(parent)) {
        const children = node.getChildren();
        for (const child of children) {
          node.insertBefore(child);
        }
        node.remove();
      }
    }),
    editor.registerNodeTransform(CollapsibleTitleNode, node => {
      const parent = node.getParent();
      if (!$isCollapsibleContainerNode(parent)) {
        node.replace($createParagraphNode().append(...node.getChildren()));
        return;
      }
    }),
    editor.registerNodeTransform(CollapsibleContainerNode, node => {
      const children = node.getChildren();
      if (
        children.length !== 2 ||
        !$isCollapsibleTitleNode(children[0]) ||
        !$isCollapsibleContentNode(children[1])
      ) {
        for (const child of children) {
          node.insertBefore(child);
        }
        node.remove();
      }
    }),
    // When collapsible is the last child pressing down/right arrow will insert paragraph
    // below it to allow adding more content. It's similar what $insertBlockNode
    // (mainly for decorators), except it'll always be possible to continue adding
    // new content even if trailing paragraph is accidentally deleted
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      $onEscapeDown,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      $onEscapeDown,
      COMMAND_PRIORITY_LOW,
    ),
    // When collapsible is the first child pressing up/left arrow will insert paragraph
    // above it to allow adding more content. It's similar what $insertBlockNode
    // (mainly for decorators), except it'll always be possible to continue adding
    // new content even if leading paragraph is accidentally deleted
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      $onEscapeUp,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      $onEscapeUp,
      COMMAND_PRIORITY_LOW,
    ),
    // Enter goes from Title to Content rather than a new line inside Title
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const titleNode = $findMatchingParent(
            selection.anchor.getNode(),
            node => $isCollapsibleTitleNode(node),
          );
          if ($isCollapsibleTitleNode(titleNode)) {
            const container = titleNode.getParent();
            if (container && $isCollapsibleContainerNode(container)) {
              if (!container.getOpen()) {
                container.toggleOpen();
              }
              titleNode.getNextSibling()?.selectEnd();
              return true;
            }
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      INSERT_COLLAPSIBLE_COMMAND,
      () => {
        editor.update(() => {
          const title = $createCollapsibleTitleNode();
          const paragraph = $createParagraphNode();
          $insertNodeToNearestRoot(
            $createCollapsibleContainerNode(true).append(
              title.append(paragraph),
              $createCollapsibleContentNode().append($createParagraphNode()),
            ),
          );
          paragraph.select();
        });
        return true;
      },
      COMMAND_PRIORITY_LOW,
    ),
  );
}

export const CollapsibleExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Collapsible',
  nodes: () => [
    CollapsibleContainerNode,
    CollapsibleTitleNode,
    CollapsibleContentNode,
  ],
  register: registerCollapsible,
});
