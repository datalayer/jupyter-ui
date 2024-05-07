/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { ColorMode } from './JupyterLabColorMode';

const DATASET_LAB_THEME = 'data-lab-theme';

type Props = {
  colorMode: ColorMode;
};

/**
 * Global flag avoiding loading styles more than once.
 */
let isLoaded = false;

/**
 * Components loading the JupyterLab CSS stylesheets.
 */
export const JupyterLabCss = (props: Props) => {
  const { colorMode } = props;
  useEffect(() => {
    if (isLoaded) {
      // no-op
      return;
    }
    isLoaded = true;
    import('@jupyterlab/apputils/style/index.js');
    import('@jupyterlab/rendermime/style/index.js');
    import('@jupyterlab/codeeditor/style/index.js');
    import('@jupyterlab/cells/style/index.js');
    import('@jupyterlab/documentsearch/style/index.js');
    import('@jupyterlab/outputarea/style/index.js');
    import('@jupyterlab/console/style/index.js');
    import('@jupyterlab/completer/style/index.js');
    import('@jupyterlab/codemirror/style/index.js');
    import('@jupyterlab/codeeditor/style/index.js');
    import('@jupyterlab/cells/style/index.js');
    import('@jupyterlab/notebook/style/index.js');
    import('@jupyterlab/filebrowser/style/index.js');
    import('@jupyterlab/terminal/style/index.js');
    import('@jupyterlab/ui-components/style/index.js');
    // ipywidgets.
    import('@jupyter-widgets/base/css/index.css');
    import('@jupyter-widgets/controls/css/widgets-base.css');
  }, []);

  useEffect(() => {
    document.body.querySelector(`style[${DATASET_LAB_THEME}]`)?.remove();

    let theme;
    switch (colorMode) {
      case 'light': {
        theme = import('!!raw-loader!@jupyterlab/theme-light-extension/style/variables.css');
        break;
      }
      case 'dark': {
        theme = import('!!raw-loader!@jupyterlab/theme-dark-extension/style/variables.css');
        break;
      }
    }

    // Inject the JupyterLab theme stylesheet in a retrievable node
    // ! webpack should be configured to load the theme style sheets
    //   with css-loader as string - this is available in css-loader v6.3.0 or later:
    //   { test: /style\/theme\.css$/i, loader: 'css-loader', options: {exportType: 'string'} }
    theme?.then(module => {

      if (module.default) {
        document.body.insertAdjacentHTML(
          'afterbegin',
          `<style ${DATASET_LAB_THEME}="${colorMode}">
${module.default}
</style>`
        );
      }
    });
  }, [colorMode]);
  return <div id="dla-JupyterLabCss-id"></div>;
};

JupyterLabCss.defaultProps = {
  colorMode: 'light',
};

export default JupyterLabCss;
