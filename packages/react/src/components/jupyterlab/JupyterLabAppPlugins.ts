/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { JupyterLab } from '@jupyterlab/application';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';

export const JupyterLabAppMinimumPlugins = {
  extensionPromises: [
    import('@jupyterlab/application-extension'),
    import('@jupyterlab/apputils-extension'),
    import('@jupyterlab/codemirror-extension'),
    import('@jupyterlab/cell-toolbar-extension'),
    import('@jupyterlab/completer-extension'),
//    import('@jupyterlab/console-extension'),
    import('@jupyterlab/docmanager-extension'),
    import('@jupyterlab/filebrowser-extension'),
    import('@jupyterlab/mainmenu-extension'),
    import('@jupyterlab/markdownviewer-extension'),
    import('@jupyterlab/markedparser-extension'),
    import('@jupyterlab/fileeditor-extension'),
    import('@jupyterlab/launcher-extension'),
    import('@jupyterlab/notebook-extension'),
    import('@jupyterlab/rendermime-extension'),
    import('@jupyterlab/shortcuts-extension'),
    import('@jupyterlab/statusbar-extension'),
    import('@jupyterlab/translation-extension'),
    import('@jupyterlab/ui-components-extension'),
  ] as Array<Promise<JupyterLab.IPluginModule>>,
  mimeExtensionPromises: [
    import('@jupyterlab/javascript-extension'),
    import('@jupyterlab/json-extension'),
  ] as Array<Promise<IRenderMime.IExtensionModule>>,
};

export const JupyterLabAppCorePlugins = () => {
  return {
    extensionPromises: [
      import('@jupyterlab/application-extension'),
      import('@jupyterlab/apputils-extension'),
      import('@jupyterlab/codemirror-extension'),
      import('@jupyterlab/cell-toolbar-extension'),
      import('@jupyterlab/completer-extension'),
//      import('@jupyterlab/console-extension'),
      import('@jupyterlab/docmanager-extension'),
      import('@jupyterlab/documentsearch-extension'),
      import('@jupyterlab/filebrowser-extension'),
      import('@jupyterlab/mainmenu-extension'),
      import('@jupyterlab/markdownviewer-extension'),
      import('@jupyterlab/markedparser-extension'),
      import('@jupyterlab/fileeditor-extension'),
      import('@jupyterlab/launcher-extension'),
//    import('@jupyterlab/lsp-extension'),
      import('@jupyterlab/notebook-extension'),
      import('@jupyterlab/rendermime-extension'),
      import('@jupyterlab/shortcuts-extension'),
      import('@jupyterlab/statusbar-extension'),
      import('@jupyterlab/translation-extension'),
      import('@jupyterlab/toc-extension'),
      import('@jupyterlab/ui-components-extension'),
    ] as Array<Promise<JupyterLab.IPluginModule>>,
    mimeExtensionPromises: [
      //    import('@jupyterlab/csvviewer-extension'),
      import('@jupyterlab/javascript-extension'),
      import('@jupyterlab/json-extension'),
    ] as Array<Promise<IRenderMime.IExtensionModule>>,
  };
};
