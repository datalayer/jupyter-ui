import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INotebookContent } from "@jupyterlab/nbformat";
import { nbformatToLexical } from "../convert/NbFormatToLexical";

type Props = {
  notebook?: INotebookContent
}

export const NbformatContentPlugin = (props: Props) => {
  const { notebook } = props;
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (notebook) {
      nbformatToLexical(notebook, editor);
    }
  }, [editor, notebook])
  return null;
}

export default NbformatContentPlugin;
