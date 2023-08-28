
import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import NotebookSimpleLayout from './layout/NotebookSimpleLayout';
import NotebookArticleLayout from './layout/NotebookArticleLayout';
import { ILayout, IDashCell, IConfig } from './Types';
import { loadSpecs } from './Specs';

const Render = (): JSX.Element => {
  const [notebook, setNotebook,] = useState<INotebookContent>();
  const [layout, setLayout] = useState<ILayout>();
  const [config, setConfig] = useState<IConfig>();
  const [dashCells, setDashCells] = useState<Array<IDashCell>>();
  useEffect(() => {
    const specs = loadSpecs();
    setLayout(specs.layout);
    const dashCells = Object.values(specs.layout.outputs)[0];
    setDashCells(dashCells);  
    setConfig(specs.config);
    if (specs.config.notebookUrl) {
      fetch(specs.config.notebookUrl, { mode: 'cors' }).then(response => {
        response.json().then(n => {
          setNotebook(n);
        });
      });
    } else {
      setNotebook(specs.notebook);
    }
  }, []);
  return (
    notebook
    && layout
    && dashCells
    ? (
      config?.layoutVariant == 'simple'
      ?
        <NotebookSimpleLayout notebook={notebook} layout={layout}/>
      :
        <NotebookArticleLayout notebook={notebook} layout={layout}/>
    )
    : <></>
  )
}

export default Render;
