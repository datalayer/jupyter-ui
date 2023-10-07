import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Text, ToggleSwitch, ThemeProvider, useTheme } from "@primer/react";
import { BoxPanel } from '@lumino/widgets';
import { NotebookPanel } from '@jupyterlab/notebook';
// import { NotebookTracker } from '@jupyterlab/notebook';
import { ThemeManager } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import Jupyter from '../jupyter/Jupyter';
import Lumino from '../jupyter/lumino/Lumino';
import { JupyterLabTheme } from '../jupyter/lab/JupyterLabTheme';
import JupyterLabApp from "../components/jupyterlab/JupyterLabApp";
import JupyterLabAppAdapter from "../components/jupyterlab/JupyterLabAppAdapter";

import * as darkThemeExtension from '@jupyterlab/theme-dark-extension';
import * as lightThemeExtension from '@jupyterlab/theme-light-extension';
import * as ipywidgetsExtension from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyExtension from 'jupyterlab-plotly/lib/jupyterlab-plugin';
import * as mimePlotlyExtension from 'jupyterlab-plotly/lib/plotly-renderer';

const height = "900px";

const PATHS = [
  "ipywidgets.ipynb",
  "plotly.ipynb",
]

const PATH_INDEX = 1;

const JupyterLabHeadlessAppExample = () => {
  const [boxPanel, setBoxPanel] = useState<BoxPanel>();
  const [theme, setTheme] = useState<JupyterLabTheme>('light');
  const [jupyterLabAdapter, setJupyterlabAdapter] = useState<JupyterLabAppAdapter>();
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
  }
  const handleSwitchChange = (dark: boolean) => {
    setDark(dark);
  }
  const onJupyterLab = async (jupyterLabAdapter: JupyterLabAppAdapter) => {
    setJupyterlabAdapter(jupyterLabAdapter);
    const jupyterLab = jupyterLabAdapter.jupyterLab;
    await jupyterLab.commands.execute('apputils:reset');
    const notebookPanel = await jupyterLab.commands.execute('docmanager:open', {
      path: PATHS[PATH_INDEX],
      factory: 'Notebook',
      kernel: { name: 'python3' },
    }) as NotebookPanel;
    Object.defineProperty((jupyterLabAdapter.shell as any), 'currentWidget', {
      get: function() { return notebookPanel },
      set: function(widget: Widget | null) {},
    });
    const boxPanel = new BoxPanel();
    boxPanel.addClass('dla-Jupyter-Notebook');
    boxPanel.spacing = 0;
    boxPanel.addWidget(notebookPanel);
    setBoxPanel(boxPanel);
  }
  const onPlugin = (themeManager: ThemeManager) => {
    // const notebookTracker = jupyterlabAdapter.service("@jupyterlab/notebook-extension:tracker") as NotebookTracker;
    console.log('Current theme', themeManager.theme);
  }
  return (
    <>
      <Jupyter startDefaultKernel={false} disableCssLoading={true} theme="light">
        <ThemeProvider colorMode={theme === 'light' ? "day" : "night"} dayScheme="light" nightScheme="dark_high_contrast">
          <Box display="flex" color="fg.default" bg="canvas.default">
            <Box mr={3}>
              <Text as="h2">JupyterLab Headless Application</Text>
            </Box>
            <Box>
              <Box>
              <Text fontSize={2} fontWeight="bold" id="switch-label" display="block" mb={1}>Dark theme</Text>
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
        { boxPanel &&
          <div style={{ position: "relative" }}>
            <Box className="jp-LabShell"
              sx={{
                position: "relative",
                '& .dla-Jupyter-Notebook': {
                  height,
                  maxHeight: height,
                  width: '100%',
                },
              }}
            >
              <Lumino>{boxPanel}</Lumino>
            </Box>
          </div>
        }
        <JupyterLabApp
          extensions={[
            lightThemeExtension,
            darkThemeExtension,
            ipywidgetsExtension,
            plotlyExtension,
          ]}
          mimeExtensions={[
            mimePlotlyExtension,
          ]}
          headless={true}
          onJupyterLab={onJupyterLab}
          pluginId="@jupyterlab/apputils-extension:themes"
          PluginType={ThemeManager}
          onPlugin={onPlugin}
        />
      </Jupyter>
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(<JupyterLabHeadlessAppExample/>);
