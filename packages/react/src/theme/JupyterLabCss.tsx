/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Colormode } from './JupyterLabColormode';

import "@primer/primitives/dist/css/base/typography/typography.css";
import "@primer/primitives/dist/css/functional/themes/light.css";
import "@primer/primitives/dist/css/functional/size/border.css";
import "@primer/primitives/dist/css/functional/size/breakpoints.css";
import "@primer/primitives/dist/css/functional/size/size-coarse.css";
import "@primer/primitives/dist/css/functional/size/size-fine.css";
import "@primer/primitives/dist/css/functional/size/size.css";
import "@primer/primitives/dist/css/functional/size/viewport.css";
import "@primer/primitives/dist/css/functional/typography/typography.css";

const DATASET_LAB_THEME = 'data-lab-theme';

const GlobalStyle = createGlobalStyle<any>`
  .jp-ThemedContainer button {
    --button-primary-bgColor-active: var(--jp-brand-color0, #0d47a1) !important;
    --button-primary-bgColor-hover: var(--jp-brand-color0, #0d47a1) !important;
    --button-primary-bgColor-rest: var(--jp-brand-color1, #1976d2) !important;
  }
`

type JupyterLabCssProps = {
  colormode?: Colormode;
};

/**
 * Global flag avoiding loading styles more than once.
 */
let isLoaded = false;

/**
 * Components loading the JupyterLab CSS stylesheets.
 */
export function JupyterLabCss(props: JupyterLabCssProps): JSX.Element {
  const { colormode = 'light' } = props;
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
    switch (colormode) {
      case 'light': {
        // @ts-expect-error unknown module
        theme = import('@jupyterlab/theme-light-extension/style/variables.css?raw');
        break;
      }
      case 'dark': {
        // @ts-expect-error unknown module
        theme = import('@jupyterlab/theme-dark-extension/style/variables.css?raw');
        break;
      }
    }

    // Inject the JupyterLab theme stylesheet in a retrievable node.
    // ! webpack should be configured to load the theme style sheets with css-loader as string - this is available in css-loader v6.3.0 or later:
    //   { test: /style\/theme\.css$/i, loader: 'css-loader', options: {exportType: 'string'} }
    theme?.then(module => {
      if (module.default) {
        document.body.insertAdjacentHTML(
          'afterbegin',
          `<style ${DATASET_LAB_THEME}="${colormode}">
${module.default}
</style>`
        );
      }
    });
  }, [colormode]);
  return (
    <div id="dla-JupyterLabCss-id">
      <GlobalStyle/>
    </div>
  )
}

export default JupyterLabCss;
