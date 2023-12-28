/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";

export class ParagraphView implements NodeView {
  public dom: HTMLDivElement;
  public contentDOM: HTMLDivElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = this.contentDOM = document.createElement('p');
    if (node.content.size == 0) {
      this.dom.classList.add('empty');
    }
  }
  update(node: Node) {
    if (node.type.name != 'paragraph') {
      return false;
    }
    if (node.content.size > 0) {
      this.dom.classList.remove('empty');
    } else {
      this.dom.classList.add('empty');
    }
    return true;
  }
}
