
import { useState, useEffect } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import BlankLayout from './layout/BlankLayout';
import SimpleLayout from './layout/SimpleLayout';
import ArticleLayout from './layout/ArticleLayout';
import { IDashboardLayout, IDashboardCell, IDashboadConfig } from './types/DashboardTypes';
import { loadDasbhoardSpecs } from './specs/DashboardSpecs';

const NotebookRender = (props: {config: IDashboadConfig, notebook: INotebookContent, layout: IDashboardLayout}) => {
  const { config, notebook, layout } = props;
  const { layoutVariant } = config;
  if (layoutVariant === 'blank') return <BlankLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  if (layoutVariant === 'simple') return <SimpleLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  if (layoutVariant === 'article') return <ArticleLayout notebook={notebook} layout={layout} adaptPlotly={true} />
  return <></>
}

const DashboardRender = (): JSX.Element => {
  const [notebook, setNotebook,] = useState<INotebookContent>();
  const [layout, setLayout] = useState<IDashboardLayout>();
  const [config, setConfig] = useState<IDashboadConfig>();
  const [dashCells, setDashCells] = useState<Array<IDashboardCell>>();
  useEffect(() => {
    const specs = loadDasbhoardSpecs();
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

export default DashboardRender;
