/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Box,
  Text,
  ToggleSwitch,
  ThemeProvider,
  useTheme,
} from '@primer/react';
import { BoxPanel } from '@lumino/widgets';
import { ThemeManager } from '@jupyterlab/apputils';
// import { NotebookTracker } from '@jupyterlab/notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Colormode } from '../theme/JupyterLabColormode';
import Lumino from '../components/lumino/Lumino';
import JupyterLabApp from '../components/jupyterlab/JupyterLabApp';
import JupyterLabAppAdapter from '../components/jupyterlab/JupyterLabAppAdapter';

import * as darkThemePlugins from '@jupyterlab/theme-dark-extension';
import * as lightThemePlugins from '@jupyterlab/theme-light-extension';
import * as ipywidgetsPlugins from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyPlugins from 'jupyterlab-plotly/lib/jupyterlab-plugin';

import * as plotlyMimeRenderers from 'jupyterlab-plotly/lib/plotly-renderer';

const height = '900px';

const PATHS = ['ipywidgets.ipynb', 'plotly.ipynb'];

const PATH_INDEX = 1;

const JupyterLabAppHeadlessServerless = () => {
  const [notebookBoxPanel, setNotebookBoxPanel] = useState<BoxPanel>();
  const [theme, setTheme] = useState<Colormode>('light');
  const [jupyterLabAdapter, setJupyterlabAdapter] =
    useState<JupyterLabAppAdapter>();
  const { setColorMode } = useTheme();
  const [isDark, setDark] = useState(false);
  const onSwitchClick = async () => {
    if (jupyterLabAdapter) {
      await jupyterLabAdapter.commands.execute('apputils:change-theme', {
        theme: isDark ? 'JupyterLab Light' : 'JupyterLab Dark',
      });
      setTheme(isDark ? 'light' : 'dark');
      setColorMode(isDark ? 'night' : 'day');
    }
    setDark(!isDark);
  };
  const handleSwitchChange = (dark: boolean) => {
    setDark(dark);
  };
  const onJupyterLab = async (jupyterLab: JupyterLabAppAdapter) => {
    setJupyterlabAdapter(jupyterLab);
    console.log('JupyterLab is ready', jupyterLab);
    const boxPanel = await jupyterLab.notebook(PATHS[PATH_INDEX]);
    setNotebookBoxPanel(boxPanel);
  };
  const onPlugin = (themeManager: ThemeManager) => {
    // const notebookTracker = jupyterlabAdapter.service("@jupyterlab/notebook-extension:tracker") as NotebookTracker;
    console.log('Current theme', themeManager.theme);
  };
  return (
    <>
      <JupyterReactTheme>
        <ThemeProvider
          colorMode={theme === 'light' ? 'day' : 'night'}
          dayScheme="light"
          nightScheme="dark_high_contrast"
        >
          <Box display="flex" color="fg.default" bg="canvas.default">
            <Box mr={3}>
              <Text as="h2">JupyterLab Headless Serverless Application</Text>
            </Box>
            <Box>
              <Box>
                <Text
                  fontSize={2}
                  fontWeight="bold"
                  id="switch-label"
                  display="block"
                  mb={1}
                >
                  Dark theme
                </Text>
              </Box>
              <Box>
                <ToggleSwitch
                  size="small"
                  onClick={onSwitchClick}
                  onChange={handleSwitchChange}
                  checked={isDark}
                  statusLabelPosition="end"
                  aria-labelledby="switch-label"
                />
              </Box>
            </Box>
          </Box>
        </ThemeProvider>
        {notebookBoxPanel && (
          <div style={{ position: 'relative' }}>
            <Box
              className="jp-LabShell"
              sx={{
                position: 'relative',
                '& .dla-Jupyter-Notebook': {
                  height,
                  maxHeight: height,
                  width: '100%',
                },
              }}
            >
              <Lumino>{notebookBoxPanel}</Lumino>
            </Box>
          </div>
        )}
        <JupyterLabApp
          headless
          serverless
          plugins={[
            lightThemePlugins,
            darkThemePlugins,
            ipywidgetsPlugins,
            plotlyPlugins,
          ]}
          mimeRenderers={[plotlyMimeRenderers]}
          onJupyterLab={onJupyterLab}
          pluginId="@jupyterlab/apputils-extension:themes"
          PluginType={ThemeManager}
          onPlugin={onPlugin}
        />
      </JupyterReactTheme>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<JupyterLabAppHeadlessServerless />);
