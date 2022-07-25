import { EditorView, NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import CellAdapter from './CellAdapter';
import { Widget } from '@lumino/widgets';

class CellView implements NodeView {
  public dom: HTMLElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = document.createElement('div');
    this.dom.classList.add('cell')
    document.body.appendChild(this.dom);
    const widget = new CellAdapter("print('hello')");
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

export default CellView;
