/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import { Jupyter } from '../jupyter';
import { Output } from '../components/output/Output';
import { cellSourceAsString } from './../utils/Utils';

import nbformat from './notebooks/NotebookOutputs.ipynb.json';

const Outputs = () => {
  return (
    <>
      <Text as="h1">Outputs</Text>
      {(nbformat as INotebookContent).cells.map((cell, index) => {
        return (
          <>
            {cell.outputs && (
              <Output
                showEditor
                autoRun={false}
                code={cellSourceAsString(cell)}
                outputs={cell.outputs as IOutput[]}
                key={index}
              />
            )}
          </>
        );
      })}
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter startDefaultKernel>
    <Outputs />
  </Jupyter>
);
