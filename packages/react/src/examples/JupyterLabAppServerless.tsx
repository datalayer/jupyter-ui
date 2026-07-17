/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, Text } from '@primer/react';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import JupyterLabApp from '../components/jupyterlab/JupyterLabApp';
import JupyterLabAppAdapter from '../components/jupyterlab/JupyterLabAppAdapter';

import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';
// import * as reactPlugins from './../jupyter/lab/index';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppServerlessExample = () => {
  const onJupyterLab = async (jupyterLabAdapter: JupyterLabAppAdapter) => {
    const jupyterLab = jupyterLabAdapter.jupyterLab;
    console.log('JupyterLab is ready', jupyterLab);
    jupyterLab.commands.execute('apputils:activate-command-palette');
    jupyterLab.commands.execute('apputils:display-notifications');
    jupyterLab.commands.execute('toc:show-panel');
  };
  return (
    <JupyterLabApp
      serverless
      //      nosplash
      plugins={[
        lightThemePlugins,
        ipywidgetsPlugins,
        plotlyPlugins,
        //        reactPlugins,
      ]}
      disabledPlugins={
        [
          //        "@jupyterlab/apputils-extension:themes",
          //        "@jupyterlab/apputils-extension:themes-palette-menu",
        ]
      }
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
        JupyterLab Serverless Application
      </Text>
    </Box>
    <JupyterLabAppServerlessExample />
  </ExampleJupyterReactTheme>
);
