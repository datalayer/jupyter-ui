/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useCallback, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Text } from '@primer/react';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import { useExampleThemeSettings } from './themeStore';
import { JupyterLabApp, JupyterLabAppAdapter } from '../components/jupyterlab';

import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as darkThemePlugins from '@jupyterlab/theme-dark-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as collaborationDocProviderPlugins from '@jupyter/docprovider-extension';
import * as collaborationPlugins from '@jupyter/collaboration-extension';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const JupyterLabAppExample = () => {
  // JupyterLab itself is only responsive to the colormode (light/dark), applied
  // via the built-in JupyterLab theme extensions.
  const { resolvedMode } = useExampleThemeSettings();
  const adapterRef = useRef<JupyterLabAppAdapter | null>(null);

  const applyColormode = useCallback(
    (adapter: JupyterLabAppAdapter, mode: 'light' | 'dark') => {
      adapter.commands
        .execute('apputils:change-theme', {
          theme: mode === 'dark' ? 'JupyterLab Dark' : 'JupyterLab Light',
        })
        .catch((reason: unknown) => {
          console.warn('Unable to apply JupyterLab colormode', reason);
        });
    },
    [],
  );

  const onJupyterLab = async (jupyterLabAdapter: JupyterLabAppAdapter) => {
    adapterRef.current = jupyterLabAdapter;
    const jupyterLab = jupyterLabAdapter.jupyterLab;
    console.log('JupyterLab is ready', jupyterLab);
    (window as any).__lab = jupyterLab;
    (window as any).__adapter = jupyterLabAdapter;
    applyColormode(jupyterLabAdapter, resolvedMode);
    jupyterLab.commands
      .execute('notebook:create-new', { kernelName: 'python3' })
      .then((notebookPanel: NotebookPanel) => {
        console.log('Jupyter Notebook Panel', notebookPanel);
      });
  };

  useEffect(() => {
    if (adapterRef.current) {
      applyColormode(adapterRef.current, resolvedMode);
    }
  }, [resolvedMode, applyColormode]);

  return (
    <JupyterLabApp
      plugins={[
        collaborationPlugins,
        collaborationDocProviderPlugins,
        darkThemePlugins,
        ipywidgetsPlugins,
        lightThemePlugins,
        plotlyPlugins,
      ]}
      mimeRenderers={[plotlyMimeRenderers]}
      // nosplash
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
        JupyterLab Application
      </Text>
    </Box>
    <JupyterLabAppExample />
  </ExampleJupyterReactTheme>
);
