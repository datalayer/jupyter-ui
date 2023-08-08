import { basicSetup } from "codemirror";
import { drawSelection, EditorView, highlightActiveLine, highlightSpecialChars, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap } from "@codemirror/commands";
import { indentOnInput } from "@codemirror/language";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";

export function createView({ doc, parent }: any) {
  const extensions = [
    basicSetup,
    drawSelection(),
    EditorState.allowMultipleSelections.of(true),
    EditorState.readOnly.of(true),
    indentOnInput(),
    highlightActiveLine(),
    highlightSpecialChars(),
    highlightSelectionMatches(),
    keymap.of(
      [
        ...defaultKeymap,
        ...searchKeymap,
      ]
    ),
    EditorView.updateListener.of((view) => {
      // Disabled since CSB's logging seems to be a perf issue
      // console.log(view);
    })
  ];
  const state = EditorState.create({
    doc,
    extensions,
  });
  return new EditorView({
    state,
    parent,
  });
}
