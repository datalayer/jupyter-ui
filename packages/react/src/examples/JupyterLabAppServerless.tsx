/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import JupyterLabApp from '../components/jupyterlab/JupyterLabApp';
import JupyterLabAppAdapter from '../components/jupyterlab/JupyterLabAppAdapter';

import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';
// import * as reactPlugins from './../jupyter/lab/index';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppServerless = () => {
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
  <JupyterReactTheme>
    <h1>JupyterLab Serverless Application</h1>
    <JupyterLabAppServerless />
  </JupyterReactTheme>
);
