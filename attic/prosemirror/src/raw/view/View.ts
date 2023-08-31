import { EditorState, Transaction } from "prosemirror-state";
import { Node } from "prosemirror-model";
import { EditorView } from "prosemirror-view";
import { ParagraphView } from "../nodes/paragraph/ParagraphView";
import ImageView from "../nodes/image/ImageView";
import LuminoView from "../nodes/lumino/LuminoView";
import CellView from "../nodes/cell/CellView";
import HashTagBlockView from "../nodes/hashtag/HashTagBlockView";
import HashTagInlineView from "../nodes/hashtag/HashTagInlineView";

const createView = (div: HTMLDivElement, state: EditorState) => {
  const view = new EditorView(div, {
    state,
    nodeViews: {
      paragraph(node: Node, view: EditorView, getPos: () => number) { 
        return new ParagraphView(node, view, getPos);
      },
      image(node: Node, view: EditorView, getPos: () => number) { 
        return new ImageView(node, view, getPos);
      },
      hashtag_block(node: Node, view: EditorView, getPos: () => number) {
        return new HashTagBlockView(node, view, getPos);
      },
      hashtag_inline(node: Node, view: EditorView, getPos: () => number) {
        return new HashTagInlineView(node, view, getPos);
      },
      lumino(node: Node, view: EditorView, getPos: () => number) {
        return new LuminoView(node, view, getPos);
      },
      cell(node: Node, view: EditorView, getPos: () => number) {
        return new CellView(node, view, kernel, getPos);
      },
    },
    dispatchTransaction(transaction: Transaction) {
      console.log('Transaction', transaction);
      const state = view.state.apply(transaction as any);
      view.updateState(state);
    }  
  } as any);
  return view;
}

export default createView;
