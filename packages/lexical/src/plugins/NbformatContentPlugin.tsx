import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { INotebookContent } from "@jupyterlab/nbformat";
import { nbformatToLexical } from "../convert/NbformatToLexical";

type Props = {
  notebook?: INotebookContent
}

export const NbformatContentPlugin = (props: Props) => {
  const { notebook } = props;
  console.log('---', notebook)
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (notebook) {
      nbformatToLexical(notebook, editor);
    }
  }, [editor, notebook])
  return null;
}

export default NbformatContentPlugin;
