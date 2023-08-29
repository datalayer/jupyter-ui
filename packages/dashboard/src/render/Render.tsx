
import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import NotebookBlankLayout from './layout/NotebookBlankLayout';
import NotebookSimpleLayout from './layout/NotebookSimpleLayout';
import NotebookArticleLayout from './layout/NotebookArticleLayout';
import { ILayout, IDashCell, IConfig } from './Types';
import { loadSpecs } from './Specs';

const NotebookRender = (props: {config: IConfig, notebook: INotebookContent, layout: ILayout}) => {
  const { config, notebook, layout } = props;
  const { layoutVariant } = config;
  if (layoutVariant === 'blank') return <NotebookBlankLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  if (layoutVariant === 'simple') return <NotebookSimpleLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  if (layoutVariant === 'article') return <NotebookArticleLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  return <></>
}

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
    && config
    && dashCells
    ? 
       <NotebookRender config={config} notebook={notebook} layout={layout}/>
    :
      <></>
  )
}

export default Render;
