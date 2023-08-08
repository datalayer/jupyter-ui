import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, ActionMenu, ActionList } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Viewer from '../components/viewer/Viewer';

// import notebook from "./notebooks/NotebookExample1.ipynb.json";

import "./../../style/index.css";

const notebooks = [
  "https://raw.githubusercontent.com/plotly/IPython-plotly/master/notebooks/bicycle_control/bicycle_control.ipynb",
  "https://raw.githubusercontent.com/anissa111/matplotlib-tutorial/main/notebooks/01-basic-matplotlib-tutorial.ipynb",
  "https://raw.githubusercontent.com/plotly/IPython-plotly/master/notebooks/survival_analysis/survival_analysis.ipynb",
]

const ViewerExample = () => {
  const [notebook, setNotebook] = useState<string>(notebooks[0]);
  const [nbformat, setNbformat] = useState<INotebookContent>();
  useEffect(() => {
    fetch(notebook)
      .then(response => {
        return response.text();
      })
      .then(nb => {
        const nbformat = nb.replaceAll('\\n', '');
        setNbformat(JSON.parse(nbformat));
      });
  }, [notebook]);
  return (
    <>
      <Box m={3}>
        <Jupyter startDefaultKernel={false}>
          <ActionMenu>
            <ActionMenu.Button>Notebook Viewer</ActionMenu.Button>
            <ActionMenu.Overlay>
              <ActionList>
                {notebooks.map(notebook => {
                  return (
                    <ActionList.Item onSelect={event => setNotebook(notebook)}>{notebook}</ActionList.Item>
                  )
                })}
              </ActionList>
            </ActionMenu.Overlay>
          </ActionMenu>
          { nbformat && <Viewer nbformat={nbformat} /> }
        </Jupyter>
      </Box>
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <ViewerExample/>
);
