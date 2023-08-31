import { createRoot } from 'react-dom/client';
import { INotebookContent, IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Output from "../components/output/Output";
import { sourceAsString } from "./../utils/Utils"

import nbformat from './notebooks/NotebookExample1.ipynb.json';

const Outputs = () => {
  return (
    <>
      <Text as="h1">Outputs</Text>
      {(nbformat as INotebookContent).cells.map((cell, index) => {
        return (
          <>
            { cell.outputs && 
              <Output
                showEditor={true}
                autoRun={false}
                code={sourceAsString(cell)}
                outputs={cell.outputs as IOutput[]}
                key={index}
              />
            }
          </>
        )}
     )}
    </>
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
