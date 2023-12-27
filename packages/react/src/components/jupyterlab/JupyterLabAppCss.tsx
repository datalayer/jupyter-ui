/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { JupyterLabTheme } from './../../jupyter/lab/JupyterLabTheme';

import '@jupyterlab/application-extension/style/index.js';
import '@jupyterlab/apputils-extension/style/index.js';
import '@jupyterlab/cell-toolbar-extension/style/index.js';
import '@jupyterlab/codemirror-extension/style/index.js';
import '@jupyterlab/completer-extension/style/index.js';
import '@jupyterlab/console-extension/style/index.js';
import '@jupyterlab/docmanager-extension/style/index.js';
import '@jupyterlab/documentsearch-extension/style/index.js';
import '@jupyterlab/filebrowser-extension/style/index.js';
import '@jupyterlab/fileeditor-extension/style/index.js';
import '@jupyterlab/javascript-extension/style/index.js';
import '@jupyterlab/json-extension/style/index.js';
import '@jupyterlab/launcher-extension/style/index.js';
import '@jupyterlab/lsp-extension/style/index.js';
import '@jupyterlab/mainmenu-extension/style/index.js';
import '@jupyterlab/notebook-extension/style/index.js';
import '@jupyterlab/rendermime-extension/style/index.js';
import '@jupyterlab/shortcuts-extension/style/index.js';
import '@jupyterlab/statusbar-extension/style/index.js';
import '@jupyterlab/toc-extension/style/index.js';
import '@jupyterlab/translation-extension/style/index.js';
import '@jupyterlab/ui-components-extension/style/index.js';

type Props = {
  theme?: JupyterLabTheme;
};

export const JupyterLabAppCss = (props: Props) => {
  const { theme } = props;
  useEffect(() => {
    switch (theme) {
      case 'light': {
        //        import('@jupyterlab/theme-light-extension/style/theme.css');
        break;
      }
      case 'dark': {
        //        import('@jupyterlab/theme-dark-extension/style/theme.css');
        break;
      }
    }
  }, [theme]);
  return <div id="dla-JupyterLabAppCss-id"></div>;
};

JupyterLabAppCss.defaultProps = {
  theme: 'light',
} as Partial<Props>;

export default JupyterLabAppCss;
