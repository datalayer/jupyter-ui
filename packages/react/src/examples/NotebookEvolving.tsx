/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { SegmentedControl } from '@primer/react';
import JupyterReactTheme from '../themes/JupyterReactTheme';
import Notebook from '../components/notebook/Notebook';

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const NotebookEvolving = () => {
  const [index, setIndex] = useState(0);
  return (
    <JupyterReactTheme>
      <SegmentedControl onChange={index => setIndex(index)}>
        <SegmentedControl.Button defaultSelected={index === 0}>Readonly</SegmentedControl.Button>
        <SegmentedControl.Button defaultSelected={index === 1}>Browser Kernel</SegmentedControl.Button>
        <SegmentedControl.Button defaultSelected={index === 2}>CPU Kernel</SegmentedControl.Button>
      </SegmentedControl>
      <Notebook
        nbformat={nbformat as INotebookContent}
        id="notebook-model-id"
        height="calc(100vh - 2.6rem)"
      />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookEvolving />);
