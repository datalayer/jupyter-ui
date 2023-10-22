import { useState } from 'react';
import { Box } from "@primer/react";
import { BoxPanel } from '@lumino/widgets';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ThemeManager } from '@jupyterlab/apputils';
import { Widget } from '@lumino/widgets';
import { Jupyter, Lumino, JupyterLabApp, JupyterLabAppAdapter } from '@datalayer/jupyter-react';

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

export const JupyterLabHeadlessAppExample = () => {
  const [boxPanel, setBoxPanel] = useState<BoxPanel>();
  const [_, setJupyterlabAdapter] = useState<JupyterLabAppAdapter>();
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
    console.log('Current theme', themeManager.theme);
  }
  return (
    <>
      <Jupyter startDefaultKernel={false} disableCssLoading={true} theme="light">
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

export default JupyterLabHeadlessAppExample;
