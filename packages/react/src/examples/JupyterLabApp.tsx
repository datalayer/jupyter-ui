import { createRoot } from 'react-dom/client';
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { NotebookPanel } from '@jupyterlab/notebook';
import Jupyter from '../jupyter/Jupyter';
import JupyterLabApp from "../components/app/JupyterLabApp";

import * as mainMenuExtension from '@jupyterlab/mainmenu-extension';
import * as applicationExtension from '@jupyterlab/application-extension';
import * as javascriptExtension from '@jupyterlab/javascript-extension';
import * as ipywidgetsExtension from '@jupyter-widgets/jupyterlab-manager';
import * as plotlyExtension from 'jupyterlab-plotly/lib/jupyterlab-plugin';
import * as mimePlotlyExtension from 'jupyterlab-plotly/lib/plotly-renderer';

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

const JupyterLabAppExample = () => {
  const onReady = (jupyterLab: JupyterLab) => {
    console.log('JupyterLab is ready', jupyterLab);
    jupyterLab.commands.execute('notebook:create-new', { kernelName: 'python3' }).then((notebookPanel: NotebookPanel) => {
      console.log('---', notebookPanel);
    });
  }
  return (
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
      hostId="jupyterlab-app-id"
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
    <h1>Jupyter React Application</h1>
    <JupyterLabAppExample/>
  </Jupyter>
);
