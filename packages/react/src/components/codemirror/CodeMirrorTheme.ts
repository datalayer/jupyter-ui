import { EditorView } from '@codemirror/view';
import { Extension } from "@codemirror/state"

const theme = EditorView.theme({
    "&": {
      fontSize: "9pt",
      border: "1px solid #c0c0c0"
    },
    ".cm-content": {
      fontFamily: "Menlo, Monaco, Lucida Console, monospace",
      minHeight: "10px"
    },
    ".cm-gutters": {
      minHeight: "10px"
    },
    ".cm-scroller": {
      overflow: "auto",
  //    maxHeight: "600px"
    }
  }
  , {dark: false}
);

export const codeMirrorTheme: Extension = [ theme ]

export default codeMirrorTheme;
