import { createRoot } from 'react-dom/client';
import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import Jupyter from '../jupyter/Jupyter';
import App from "../components/app/App";

import * as mainMenuExtension from '@jupyterlab/mainmenu-extension';
import * as applicationExtension from '@jupyterlab/application-extension';

import * as javascriptExtension from '@jupyterlab/javascript-extension';

const extensionsPromises = [

//  import('@jupyterlab/application-extension'),
//  import('@jupyterlab/mainmenu-extension'),

  import('@jupyterlab/apputils-extension'),
  import('@jupyterlab/codemirror-extension'),
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

const mimeExtensionsPromises = [
  import('@jupyterlab/json-extension'),
] as Array<Promise<IRenderMime.IExtensionModule>>;

const JupyterReactApp = () => (
  <App
    extensions={[
      applicationExtension,
      mainMenuExtension,
    ]}
    mimeExtensions={[
      javascriptExtension,
    ]}
    extensionPromises={extensionsPromises}
    mimeExtensionsPromises={mimeExtensionsPromises}
  />
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter startDefaultKernel={false} disableCssLoading={false}>
    <h1>Jupyter React Application</h1>
    <JupyterReactApp/>
  </Jupyter>
);
