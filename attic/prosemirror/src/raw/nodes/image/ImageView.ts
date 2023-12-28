/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { EditorView, NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";

class ImageView implements NodeView {
  public dom: HTMLImageElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = document.createElement('img');
    this.dom.src = node.attrs.src;
    this.dom.alt = node.attrs.alt;
    this.dom.addEventListener('click', e => {
      e.preventDefault();
      if (!this.dom.alt) {
        let alt = prompt('New alt text:', '');
        if (alt) {
          view.dispatch(
            (view.state.tr as any).setNodeMarkup(getPos(), undefined, {
              src: node.attrs.src,
              alt,
            })
          );
        }
      }
    });
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

export default ImageView;
