import { createRoot } from 'react-dom/client';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Output from "../components/output/Output";

import nbformat from './samples/IPyWidgetsExample1.ipynb.json';
// import nbformat from './samples/DashboardExample.exclude.json';

const Outputs = () => {
  return (
    (nbformat as INotebookContent).cells.map((cell, index) => {
      return (
        <>
          <Text as="h1">Output {index}</Text>
          { cell.outputs && 
            <Output
              showEditor={false}
              autoRun={false}
              outputs={cell.outputs as IOutput[]}
              key={index}
            />
          }
        </>
      )}
    )
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <Outputs />
  </Jupyter>
);
