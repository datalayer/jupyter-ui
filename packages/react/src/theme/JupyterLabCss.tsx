/*
 * Copyright (c) 2021-Present Datalayer, Inc.
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
  manageThemeLinks?: boolean;
};

/**
 * Global flag avoiding loading styles more than once.
 */
let isLoaded = false;

/**
 * Components loading the JupyterLab CSS stylesheets.
 */
export function JupyterLabCss(props: JupyterLabCssProps): JSX.Element {
  const { colormode = 'light', manageThemeLinks = true } = props;
  useEffect(() => {
    if (isLoaded) {
      // no-op
      return;
    }
    isLoaded = true;
    import('@jupyterlab/apputils/style/index.js');
    import('@jupyterlab/cells/style/index.js');
    import('@jupyterlab/cells/style/index.js');
    import('@jupyterlab/codeeditor/style/index.js');
    import('@jupyterlab/codeeditor/style/index.js');
    import('@jupyterlab/codemirror/style/index.js');
    import('@jupyterlab/completer/style/index.js');
    import('@jupyterlab/console/style/index.js');
    import('@jupyterlab/documentsearch/style/index.js');
    import('@jupyterlab/filebrowser/style/index.js');
    import('@jupyterlab/mathjax-extension/style/index.js');
    import('@jupyterlab/notebook/style/index.js');
    import('@jupyterlab/outputarea/style/index.js');
    import('@jupyterlab/rendermime/style/index.js');
    import('@jupyterlab/terminal/style/index.js');
    import('@jupyterlab/ui-components/style/index.js');
    // ipywidgets.
    import('@jupyter-widgets/base/css/index.css');
    import('@jupyter-widgets/controls/css/widgets-base.css');
  }, [colormode]);

  /*
   * Let go of the variables of a JupyterLab that owns them.
   *
   * The injection below pins the `--jp-*` variables of one color mode at the
   * end of the body, over anything the theme manager of a JupyterLab appends.
   * That is right when nothing else themes the page — and wrong the moment
   * something does: whatever was pinned keeps winning, so a theme picked from
   * the menu of the application changes its links and nothing on screen. The
   * decision is not fixed for the life of the component either, as the
   * application it is rendered in is discovered after the first render, so
   * what was pinned before is dropped here rather than left behind.
   */
  useEffect(() => {
    if (manageThemeLinks) {
      return;
    }
    document.body.querySelector(`style[${DATA_JUPYTERLAB_THEME}]`)?.remove();
  }, [manageThemeLinks]);

  useEffect(() => {
    if (!manageThemeLinks) {
      return;
    }
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
     * Silence the <link> tags of JupyterLab's theme manager that conflict with
     * the desired colormode. The theme manager's loadCSS() appends
     * <link rel="stylesheet"> to <body> asynchronously, so we need both:
     * 1. Immediate cleanup of existing links
     * 2. A MutationObserver to catch links added after our injection
     *
     * Disabled, never removed: a link that is taken out of the document is not
     * given back, and the theme manager holds it as loaded — so a page that
     * stops being themed from here, once it turns out to be a JupyterLab of
     * its own, would be left with no theme variables at all. Disabling is the
     * same effect and is undone below.
     */
    const silenced = new Set<HTMLLinkElement>();
    function silence(link: HTMLLinkElement) {
      if (!link.disabled) {
        link.disabled = true;
        silenced.add(link);
      }
    }
    function silenceConflictingThemeLinks() {
      document.body
        .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
        .forEach(link => {
          if ((link.getAttribute('href') || '').includes(oppositeTheme)) {
            silence(link);
          }
        });
    }

    // The variables are read from a module, which arrives after this effect
    // may have been undone: nothing is pinned once it no longer applies.
    let disposed = false;

    // Observe <body> for new <link> nodes added by the theme manager
    const observer = new MutationObserver(mutations => {
      for (const mutation of Array.from(mutations)) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLLinkElement && node.rel === 'stylesheet') {
            const href = node.getAttribute('href') || '';
            if (href.includes(oppositeTheme)) {
              silence(node);
            }
          }
        }
      }
    });
    observer.observe(document.body, { childList: true });

    // Inject the JupyterLab theme stylesheet in a retrievable node.
    theme
      ?.then(module => {
        const css = module.default;
        if (css && !disposed) {
          // Remove any previously injected theme style tag
          document.body
            .querySelector(`style[${DATA_JUPYTERLAB_THEME}]`)
            ?.remove();
          // Silence any conflicting theme links already in the DOM
          silenceConflictingThemeLinks();
          // Inject at the END of body so it takes precedence over
          // any <link> tags the JupyterLab theme manager may have appended.
          document.body.insertAdjacentHTML(
            'beforeend',
            `<style ${DATA_JUPYTERLAB_THEME}="${colormode}">
${css}
</style>`
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
      disposed = true;
      observer.disconnect();
      silenced.forEach(link => {
        link.disabled = false;
      });
      silenced.clear();
    };
  }, [colormode, manageThemeLinks]);
  return (
    <div id="dla-JupyterLabCss-id">
      <GlobalStyle />
    </div>
  );
}

export default JupyterLabCss;
