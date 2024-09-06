/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { NotebookPanel } from '@jupyterlab/notebook';
import JupyterLabTheme from '../jupyter/lab/JupyterLabTheme';
import JupyterLabApp from '../components/jupyterlab/JupyterLabApp';
import JupyterLabAppAdapter from '../components/jupyterlab/JupyterLabAppAdapter';
import JupyterServiceManagerLess from '../jupyter/services/JupyterServiceManagerLess';

import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';
// import * as reactPlugins from './../jupyter/lab/index';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppServiceManager = () => {
  const [serviceManager, _] = useState(new JupyterServiceManagerLess());
  const onJupyterLab = async (jupyterLabAdapter: JupyterLabAppAdapter) => {
    const jupyterLab = jupyterLabAdapter.jupyterLab;
    console.log('JupyterLab is ready', jupyterLab);
    jupyterLab.commands.execute('apputils:activate-command-palette');
    jupyterLab.commands.execute('apputils:display-notifications');
    jupyterLab.commands.execute('toc:show-panel');
    jupyterLab.commands
      .execute('notebook:create-new', { kernelName: 'python3' })
      .then((notebookPanel: NotebookPanel) => {
        console.log('Jupyter Notebook Panel', notebookPanel);
      });
  };
  return (
    <JupyterLabApp
      serviceManager={serviceManager}
      plugins={[
        lightThemePlugins,
        ipywidgetsPlugins,
        plotlyPlugins,
//        reactPlugins,
      ]}
      mimeRenderers={[
        plotlyMimeRenderers
      ]}
      height="calc(100vh - 74px)"
      onJupyterLab={onJupyterLab}
    />
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterLabTheme>
    <h1>JupyterLab Application with Service Manager property</h1>
    <JupyterLabAppServiceManager />
  </JupyterLabTheme>
);
