import { Node } from "prosemirror-model";
import { EditorView, NodeView } from "prosemirror-view";

import "./HashTagBlockView.css";

class HashTagBlockView implements NodeView {
  public dom: HTMLDivElement;
  public contentDOM: HTMLSpanElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = document.createElement("div");
    this.dom.classList.add('hashtag_block')
    const label = document.createElement("label");
    label.innerText = "hashtag-block: ";
    label.contentEditable = "false";
    this.contentDOM = document.createElement("span");
    this.dom.appendChild(label);
    this.dom.appendChild(this.contentDOM);
  }
  selectNode() {
    this.dom.classList.add("ProseMirror-selectednode");
  }
  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
  }
  ignoreMutation(m: MutationRecord | { type: 'selection'; target: Element; }) {
    return true;
  }
  stopEvent(e: Event) {
    return false;
  }
}

export default HashTagBlockView;
