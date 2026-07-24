/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Text } from '@primer/react';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { ServiceManagerLess } from '../jupyter';
import { JupyterLabApp, JupyterLabAppAdapter } from '../components/jupyterlab';

import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';
// import * as reactPlugins from './../jupyter/lab/plugin';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppServiceManagerExample = () => {
  const [serviceManager, _] = useState(new ServiceManagerLess());
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
      mimeRenderers={[plotlyMimeRenderers]}
      height="calc(100vh - 74px)"
      onJupyterLab={onJupyterLab}
    />
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <ExampleJupyterReactTheme>
    <Box sx={{ px: 3, py: 2, bg: 'canvas.default' }}>
      <Text as="h1" sx={{ m: 0, color: 'fg.default', fontSize: 4, fontWeight: 'bold' }}>
        JupyterLab Application with Service Manager
      </Text>
    </Box>
    <JupyterLabAppServiceManagerExample />
  </ExampleJupyterReactTheme>
);
