/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { JupyterLabTheme } from './JupyterLabTheme';

type Props = {
  theme: JupyterLabTheme;
};

export const JupyterLabCss = (props: Props) => {
  const { theme } = props;
  useEffect(() => {
    import('@jupyterlab/apputils/style/base.css');
    import('@jupyterlab/rendermime/style/base.css');
    import('@jupyterlab/codeeditor/style/base.css');
    import('@jupyterlab/cells/style/base.css');
    import('@jupyterlab/documentsearch/style/base.css');
    import('@jupyterlab/outputarea/style/base.css');
    import('@jupyterlab/console/style/base.css');
    import('@jupyterlab/completer/style/base.css');
    import('@jupyterlab/codemirror/style/base.css');
    import('@jupyterlab/codeeditor/style/base.css');
    import('@jupyterlab/cells/style/base.css');
    import('@jupyterlab/notebook/style/base.css');
    import('@jupyterlab/filebrowser/style/base.css');
    import('@jupyterlab/terminal/style/index.css');
    switch (theme) {
      case 'light': {
        import('@jupyterlab/theme-light-extension/style/theme.css');
        break;
      }
      case 'dark': {
        import('@jupyterlab/theme-dark-extension/style/theme.css');
        break;
      }
    }
    import('@jupyterlab/ui-components/style/base.css');
    // ipywidgets.
    import('@jupyter-widgets/base/css/index.css');
    import('@jupyter-widgets/controls/css/widgets-base.css');
  }, [theme]);
  return <div id="dla-JupyterLabCss-id"></div>;
};

JupyterLabCss.defaultProps = {
  theme: 'light',
};

export default JupyterLabCss;
