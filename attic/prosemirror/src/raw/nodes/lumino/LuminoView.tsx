/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { EditorView, NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import LuminoExample from './LuminoExample';
import { Widget } from '@lumino/widgets';

class LuminoView implements NodeView {
  public dom: HTMLElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = document.createElement('div');
    this.dom.classList.add('lumino')
    document.body.appendChild(this.dom);
    const widget = new LuminoExample();
    Widget.attach(widget.panel, this.dom);
  }
  selectNode() {
    this.dom.classList.add("ProseMirror-selectednode");
  }
  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
  }
  ignoreMutation(m: MutationRecord) {
    return true;
  }
  stopEvent(e: Event) {
    return false;
  }
}

export default LuminoView;
