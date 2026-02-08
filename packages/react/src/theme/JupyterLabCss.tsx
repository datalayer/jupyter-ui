/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Colormode } from './JupyterLabColormode';

const DATA_JUPYTERLAB_THEME = 'data-jupyterlab-theme';

const GlobalStyle = createGlobalStyle<any>`
  .jp-ThemedContainer button {
    --button-primary-bgColor-active: var(--jp-brand-color0, #3a4047ff) !important;
    --button-primary-bgColor-hover: var(--jp-brand-color0, #0d47a1) !important;
    --button-primary-bgColor-rest: var(--jp-brand-color1, #1976d2) !important;
  }
`;

export type JupyterLabCssProps = {
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
  }, [colormode]);

  useEffect(() => {
    let theme;
    switch (colormode) {
      case 'light': {
        theme =
          import('@jupyterlab/theme-light-extension/style/variables.css?raw');
        break;
      }
      case 'dark': {
        theme =
          import('@jupyterlab/theme-dark-extension/style/variables.css?raw');
        break;
      }
    }

    // The opposite theme name we need to suppress
    const oppositeTheme =
      colormode === 'dark' ? 'theme-light-extension' : 'theme-dark-extension';

    /**
     * Remove any <link> tags from JupyterLab's theme manager that conflict
     * with the desired colormode. The theme manager's loadCSS() appends
     * <link rel="stylesheet"> to <body> asynchronously, so we need both:
     * 1. Immediate cleanup of existing links
     * 2. A MutationObserver to catch links added after our injection
     */
    function removeConflictingThemeLinks() {
      document.body.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href.includes(oppositeTheme)) {
          console.log(
            `[JupyterLabCss] Removing conflicting theme link: ${href}`
          );
          link.remove();
        }
      });
    }

    // Observe <body> for new <link> nodes added by the theme manager
    const observer = new MutationObserver(mutations => {
      for (const mutation of Array.from(mutations)) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
            const href = node.getAttribute('href') || '';
            if (href.includes(oppositeTheme)) {
              console.log(
                `[JupyterLabCss] Observer removing conflicting theme link: ${href}`
              );
              node.remove();
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true });

    // Inject the JupyterLab theme stylesheet in a retrievable node.
    console.log(
      `[JupyterLabCss] Loading theme variables for colormode: ${colormode}`
    );
    theme
      ?.then(module => {
        const css = module.default;
        if (css) {
          // Remove any previously injected theme style tag
          document.body
            .querySelector(`style[${DATA_JUPYTERLAB_THEME}]`)
            ?.remove();
          // Remove any conflicting theme links already in the DOM
          removeConflictingThemeLinks();
          // Inject at the END of body so it takes precedence over
          // any <link> tags the JupyterLab theme manager may have appended.
          document.body.insertAdjacentHTML(
            'beforeend',
            `<style ${DATA_JUPYTERLAB_THEME}="${colormode}">
${css}
</style>`
          );
          console.log(
            `[JupyterLabCss] Injected style tag for ${colormode} at end of body`
          );
        }
      })
      .catch(err => {
        console.error(
          `[JupyterLabCss] Failed to load theme variables for ${colormode}:`,
          err
        );
      });

    return () => {
      observer.disconnect();
    };
  }, [colormode]);
  return (
    <div id="dla-JupyterLabCss-id">
      <GlobalStyle />
    </div>
  );
}

export default JupyterLabCss;
