/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INotebookContent } from '@jupyterlab/nbformat';
import { nbformatToLexical } from '../convert';

type Props = {
  notebook?: INotebookContent;
};

export const NbformatContentPlugin = (props: Props) => {
  const { notebook } = props;
  const [editor] = useLexicalComposerContext();
  const lastAppliedNotebook = useRef<string | null>(null);

  useEffect(() => {
    if (!notebook) {
      return;
    }

    // React StrictMode mounts effects twice in development. Applying the same
    // notebook snapshot repeatedly can corrupt selection references while the
    // editor root is mounting, so apply each snapshot only once.
    const snapshot = JSON.stringify(notebook);
    if (snapshot === lastAppliedNotebook.current) {
      return;
    }

    lastAppliedNotebook.current = snapshot;
    nbformatToLexical(notebook, editor);
  }, [editor, notebook]);

  return null;
};

export default NbformatContentPlugin;
