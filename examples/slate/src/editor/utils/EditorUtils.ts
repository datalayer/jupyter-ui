import { Editor, Element, Point, Range, Text, Transforms } from "slate";
import isUrl from "is-url";

export const getBlockType = (editor: Editor) => {
  const selection = editor.selection;
  if (selection == null) {
    return null;
  }
  const topLevelBlockNodesInSelection = Editor.nodes(editor, {
    at: editor.selection as Range,
    mode: "highest",
    match: (n) => Editor.isBlock(editor, n),
  });
  let blockType = null;
  let nodeEntry = topLevelBlockNodesInSelection.next();
  while (!nodeEntry.done) {
    const [node] = nodeEntry.value;
    if (Element.isElement(node)) {
      if (blockType == null) {
        blockType = node.type;
      } else if (blockType !== node.type) {
        return "multiple";
      }
    }
    nodeEntry = topLevelBlockNodesInSelection.next();
  }
  return blockType !== "image" ? blockType : null;
}

export const toggleBlockType = (editor: Editor, blockType: any) => {
  const currentBlockType = getBlockType(editor);
  const changeTo = currentBlockType === blockType ? "paragraph" : blockType;
  Transforms.setNodes(
    editor,
    { type: changeTo },
    { at: editor.selection as Range, match: (n) => Editor.isBlock(editor, n) }
  );
}

export const hasActiveLinkAtSelection = (editor: Editor) => {
  return isLinkNodeAtSelection(editor, editor.selection!);
}

export const toggleLinkAtSelection = (editor: Editor) => {
  if(editor.selection == null) {
    return;
  }
  if (hasActiveLinkAtSelection(editor)) {
    Transforms.unwrapNodes(editor, {
      match: (n) => Element.isElement(n) && n.type === "link",
    });
  } else {
    const isSelectionCollapsed =
      editor.selection == null || Range.isCollapsed(editor.selection);
    if (isSelectionCollapsed) {
      createLinkForRange(editor, null, "link", "", true /*isInsertion*/);
    } else {
      createLinkForRange(editor, editor.selection, "", "", false);
    }
  }
}

export const isLinkNodeAtSelection = (editor: Editor, selection: Range) => {
  if (selection == null) {
    return false;
  }
  return (
    Editor.above(editor, {
      at: selection,
      match: (n) => Element.isElement(n) && n.type === "link",
    }) != null
  );
}

const createLinkForRange = (editor: Editor, range: Range | null, linkText: string, linkURL: string, isInsertion: boolean) => {
  isInsertion
    ? Transforms.insertNodes(
        editor,
        {
          type: "link",
          url: linkURL,
          children: [{ text: linkText }],
        },
        range != null ? { at: range } : undefined
      )
    : Transforms.wrapNodes(
        editor,
        { type: "link", url: linkURL, children: [{ text: linkText }] },
        { split: true, at: range as Range}
      );
}

export const identifyLinks = (editor: Editor) => {
  // if selection is not collapsed, we do not proceed with the link detection.
  if (editor.selection == null || !Range.isCollapsed(editor.selection)) {
    return;
  }
  const [node] = Editor.parent(editor, editor.selection);
  // if we are already inside a link, exit early.
  if (Element.isElement(node) && node.type === "link") {
    return;
  }
  const [currentNode, currentNodePath] = Editor.node(editor, editor.selection);
  if (!Text.isText(currentNode)) {
    return;
  }
  let [start] = Range.edges(editor.selection);
  const cursorPoint = start;
  const startPointOfLastCharacter = Editor.before(editor, editor.selection, {
    unit: "character",
  });
  let lastCharacter = Editor.string(
    editor,
    Editor.range(editor, startPointOfLastCharacter!, cursorPoint)
  );
  if (lastCharacter !== " ") {
    return;
  }
  let end = startPointOfLastCharacter;
  start = Editor.before(editor, end as Point, {
    unit: "character",
  }) as Point;
  const startOfTextNode = Editor.point(editor, currentNodePath, {
    edge: "start",
  });
  lastCharacter = Editor.string(editor, Editor.range(editor, start, end));
  while (lastCharacter !== " " && !Point.isBefore(start, startOfTextNode)) {
    end = start;
    start = Editor.before(editor, end, { unit: "character" }) as Point;
    lastCharacter = Editor.string(editor, Editor.range(editor, start, end));
  }
  const lastWordRange = Editor.range(editor, end as Point, startPointOfLastCharacter);
  const lastWord = Editor.string(editor, lastWordRange);
  if (isUrl(lastWord)) {
    Promise.resolve().then(() =>
      createLinkForRange(editor, lastWordRange, lastWord, lastWord, false)
    );
  }
}

export const getFirstTextNodeAtSelection = (editor: Editor, selection: Range) => {
  const selectionForNode = selection ?? editor.selection;
  if (selectionForNode == null) {
    return null;
  }
  const textNodeEntry = Editor.nodes(editor, {
    at: selectionForNode,
    mode: "lowest",
  }).next().value;
  return textNodeEntry != null && Text.isText(textNodeEntry[0])
    ? textNodeEntry[0]
    : null;
}

export const deleteCurrentBlock = (editor: Editor) => {
  const block = Editor.nodes(editor, {
    at: editor.selection as Range,
    mode: "highest",
    match: (n) => Editor.isBlock(editor, n),
  });
  const value = block.next().value;
  if (value) {
    const path = value[1]
    Transforms.delete(editor, {
      at: path,
      unit: "block",
    });
  }
}
