import { Plugin, NodeSelection, TextSelection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const handleSelectionChange = (view: EditorView) => {
  const selection = view.state.selection;
  if (selection instanceof TextSelection) {
    if (selection.$cursor) {
      if (selection.$cursor.parent.type.name === "hashtag_inline") {
        const sel = NodeSelection.create(
          view.state.doc,
          selection.$cursor.before(selection.$cursor.depth),
        );
        const tr = view.state.tr;
        tr.setSelection(sel as any);
        view.dispatch(tr);
      }
    }
  }
};

export const hashtagInlinePlugin = new Plugin({
  view: () => ({
    update: (view: EditorView) => {
      handleSelectionChange(view);
    }
  })
});
