/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import NotebookToolbar from './toolbars/NotebookToolbar';
import CellSidebar from '../components/notebook/cell/sidebar/CellSidebar';

import nbformatExample from './notebooks/NotebookExample1.ipynb.json';

const NotebookReadonly = () => {
  const [content, setContent] = useState<INotebookContent>()
  useEffect(() => {
    const exampleNotebook = nbformatExample as INotebookContent;
    exampleNotebook.cells.forEach(cell => {
      cell.metadata['editable'] = false;
    })
    setContent(exampleNotebook);
  }, []);
  return (
    <Jupyter>
      <Notebook
        nbformat={content}
        id="notebook-model-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        cellSidebarMargin={120}
        CellSidebar={CellSidebar}
        Toolbar={NotebookToolbar}
      />
    </Jupyter>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookReadonly />);
