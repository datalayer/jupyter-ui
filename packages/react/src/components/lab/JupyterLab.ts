import { JupyterLab } from '@jupyterlab/application';
import { PageConfig } from '@jupyterlab/coreutils';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

// The webpack public path needs to be set before loading the CSS assets.
(global as any).__webpack_public_path__ = PageConfig.getOption('fullStaticUrl') + '/';

const styles = import('./JupyterLabStyles' as any) as Promise<any>;

const extensions = [
  import('@jupyterlab/application-extension'),
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
  import('@jupyterlab/mainmenu-extension'),
  import('@jupyterlab/notebook-extension').then(plugins =>
    plugins.default.filter(({ id }) => !(
      id.includes(':language-server') ||
      id.includes(':toc') ||
      id.includes(':update-raw-mimetype') ||
      id.includes(':search')
    ))
  ),
  import('@jupyterlab/rendermime-extension'),
  import('@jupyterlab/shortcuts-extension'),
  import('@jupyterlab/statusbar-extension'),
  import('@jupyterlab/theme-light-extension'),
  import('@jupyterlab/translation-extension'),
  import('@jupyterlab/ui-components-extension')
] as Array<Promise<JupyterLab.IPluginModule>>;

const mimeExtensions = [
  import('@jupyterlab/json-extension'),
] as Array<Promise<IRenderMime.IExtensionModule>>;

window.addEventListener('load', async function () {
  // Make sure the styles have loaded.
  await styles;
  // Initialize JupyterLab with the mime extensions and application extensions.
  const lab = new JupyterLab({
    mimeExtensions: await Promise.all(mimeExtensions),
  });
  lab.registerPluginModules(await Promise.all(extensions));
  console.log('Starting JupyterLab application.');
  await lab.start();
  console.log('JupyterLab application started, waiting for restore.');
  await lab.restored;
  console.log('JupyterLab application is restored.');
});
