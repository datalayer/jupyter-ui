import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box } from "@primer/react";
import { BoxPanel } from '@lumino/widgets';
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { NotebookPanel } from '@jupyterlab/notebook';
// import { NotebookTracker } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import Jupyter from '../jupyter/Jupyter';
import Lumino from '../jupyter/lumino/Lumino';
import JupyterLabApp from "../components/app/JupyterLabApp";
import JupyterLabAppAdapter from "../components/app/JupyterLabAppAdapter";

import * as mainMenuExtension from '@jupyterlab/mainmenu-extension';
import * as applicationExtension from '@jupyterlab/application-extension';
import * as javascriptExtension from '@jupyterlab/javascript-extension';
import * as ipywidgetsExtension from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyExtension from 'jupyterlab-plotly/lib/jupyterlab-plugin';
import * as mimePlotlyExtension from 'jupyterlab-plotly/lib/plotly-renderer';

const PATHS = [
  "ipywidgets.ipynb",
  "plotly.ipynb"
]

const PATH_INDEX = 1;

const extensionPromises = [
//  import('@jupyterlab/application-extension'),
  import('@jupyterlab/apputils-extension'),
  import('@jupyterlab/codemirror-extension'),
  import('@jupyterlab/cell-toolbar-extension'),
  import('@jupyterlab/completer-extension'),
  import('@jupyterlab/console-extension'),
  import('@jupyterlab/docmanager-extension'),
  import('@jupyterlab/filebrowser-extension'),
  import('@jupyterlab/fileeditor-extension').then(plugins =>
    plugins.default.filter(({ id }) => !(
      id.includes(':language-server') ||
      id.includes(':search')
    ))
  ),
  import('@jupyterlab/launcher-extension'),
//  import('@jupyterlab/mainmenu-extension'),
  import('@jupyterlab/markdownviewer-extension'),
  import('@jupyterlab/markedparser-extension'),
  import('@jupyterlab/notebook-extension').then(plugins => {
    return plugins.default.filter(({ id }) => !(
      id.includes(':language-server') ||
      id.includes(':toc') ||
      id.includes(':update-raw-mimetype') ||
      id.includes(':search')
    ))}
  ),
  import('@jupyterlab/rendermime-extension'),
  import('@jupyterlab/shortcuts-extension'),
  import('@jupyterlab/statusbar-extension'),
  import('@jupyterlab/translation-extension'),
  import('@jupyterlab/ui-components-extension'),
  import('@jupyterlab/theme-light-extension'),
] as Array<Promise<JupyterLab.IPluginModule>>;

const mimeExtensionPromises = [
  import('@jupyterlab/json-extension'),
] as Array<Promise<IRenderMime.IExtensionModule>>;

const height = "800px";

const JupyterLabHeadlessAppExample = () => {
  const [boxPanel, setBoxPanel] = useState<BoxPanel>();
  const onReady = async (jupyterlabAdapter: JupyterLabAppAdapter) => {
    const jupyterlab = jupyterlabAdapter.jupyterlab;
    await jupyterlab.commands.execute('apputils:reset');
    const notebookPanel = await jupyterlab.commands.execute('docmanager:open', { path: PATHS[PATH_INDEX], factory: 'Notebook', kernel: { name: 'python3' } }) as NotebookPanel;
//    const notebookTracker = jupyterlabAdapter.service("@jupyterlab/notebook-extension:tracker") as NotebookTracker;
    Object.defineProperty((jupyterlabAdapter.shell as any), 'currentWidget', {
      get: function() { return notebookPanel },
      set: function(widget: Widget | null) {},
    });
    const boxPanel = new BoxPanel();
    boxPanel.addClass('dla-Jupyter-Notebook');
    boxPanel.spacing = 0;
    boxPanel.addWidget(notebookPanel);
    setBoxPanel(boxPanel);
  }
  return (
    <>
      { boxPanel && 
        <div style={{ height, width: '100%', position: "relative" }}>
        <Box className="jp-LabShell"
          sx={{
            '& .dla-Jupyter-Notebook': {
              height,
              maxHeight: height,
              width: '100%',
            },
          }}
        >
          <Box>
            <Lumino>{boxPanel}</Lumino>
          </Box>
        </Box >
      </div>      
      }
      <JupyterLabApp
        extensions={[
          applicationExtension,
          mainMenuExtension,
          ipywidgetsExtension,
          plotlyExtension,
        ]}
        mimeExtensions={[
          javascriptExtension,
          mimePlotlyExtension,
        ]}
        extensionPromises={extensionPromises}
        mimeExtensionPromises={mimeExtensionPromises}
        headless={true}
        hostId="jupyterlab-headless-id"
        onReady={onReady}
      />
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter startDefaultKernel={false} disableCssLoading={true}>
    <h1>JupyterLab Headless Application</h1>
    <JupyterLabHeadlessAppExample/>
  </Jupyter>
);
