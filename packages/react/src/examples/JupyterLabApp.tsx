import { createRoot } from 'react-dom/client';
import { NotebookPanel } from '@jupyterlab/notebook';
import Jupyter from '../jupyter/Jupyter';
import JupyterLabApp from "../components/app/JupyterLabApp";
import JupyterLabAppAdapter from "../components/app/JupyterLabAppAdapter";

import * as ipywidgetsExtension from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyExtension from 'jupyterlab-plotly/lib/jupyterlab-plugin';
import * as mimePlotlyExtension from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppExample = () => {
  const onReady = async (jupyterlabAdapter: JupyterLabAppAdapter) => {
    const jupyterlab = jupyterlabAdapter.jupyterlab;
    console.log('JupyterLab is ready', jupyterlab);
    jupyterlab.commands.execute('notebook:create-new', { kernelName: 'python3' }).then((notebookPanel: NotebookPanel) => {
      console.log('Notebook Panel', notebookPanel);
    });
  }
  return (
    <JupyterLabApp
      extensions={[
        ipywidgetsExtension,
        plotlyExtension,
      ]}
      mimeExtensions={[
        mimePlotlyExtension,
      ]}
      height="calc(100vh - 74px)"
      onReady={onReady}
    />
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter startDefaultKernel={false} disableCssLoading={true}>
    <h1>JupyterLab Application</h1>
    <JupyterLabAppExample/>
  </Jupyter>
);
