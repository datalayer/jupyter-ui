/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import type { JSX } from 'react';
import { useEffect, useRef, useSyncExternalStore } from 'react';
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
 * Which run of the theme effect currently owns the injected variables.
 *
 * The injection waits on a dynamic import, and the question when it lands is
 * not "does the effect that started me still exist" but "has anything newer
 * asked for a different theme". Those came to the same thing only by
 * accident, and where they differ — an effect torn down while its chunk is
 * still in flight — the old test threw the variables away for good.
 */
let themeEpoch = 0;

/** Resolves when the JupyterLab stylesheets are in the document. */
let cssReady: Promise<void> | null = null;

/** Subscribers waiting to re-render once the stylesheets have landed. */
const cssListeners = new Set<() => void>();

/**
 * Load the JupyterLab stylesheets, once, and say when they are in.
 *
 * These arrive as eighteen separate dynamic `import()`s — that is, eighteen
 * webpack chunks fetched over the network — and until they land, anything
 * rendered against them is drawn with no rules at all. Firing them from an
 * effect and returning immediately, which is what this used to do, means the
 * first visit to a page with a notebook on it paints an unstyled notebook and
 * then repairs itself; a reload looks correct only because the chunks are in
 * the browser cache by then. That is the whole of the "broken layout until I
 * refresh" report.
 *
 * So the work is exposed as a promise the components that actually need these
 * rules can wait on, rather than a fire-and-forget effect.
 *
 * It resolves on failure too — but only once every one of them has settled. A
 * chunk that 404s must leave a caller showing an ugly notebook, never a caller
 * waiting forever on a stylesheet that is not coming; it must equally not
 * release a caller while the other fifteen are still arriving.
 */
export function loadJupyterLabCss(): Promise<void> {
  if (cssReady) {
    return cssReady;
  }
  const sheets: [string, Promise<unknown>][] = [
    ['@jupyterlab/apputils/style/index.js', import('@jupyterlab/apputils/style/index.js')],
    ['@jupyterlab/cells/style/index.js', import('@jupyterlab/cells/style/index.js')],
    ['@jupyterlab/codeeditor/style/index.js', import('@jupyterlab/codeeditor/style/index.js')],
    ['@jupyterlab/codemirror/style/index.js', import('@jupyterlab/codemirror/style/index.js')],
    ['@jupyterlab/completer/style/index.js', import('@jupyterlab/completer/style/index.js')],
    ['@jupyterlab/console/style/index.js', import('@jupyterlab/console/style/index.js')],
    ['@jupyterlab/documentsearch/style/index.js', import('@jupyterlab/documentsearch/style/index.js')],
    ['@jupyterlab/filebrowser/style/index.js', import('@jupyterlab/filebrowser/style/index.js')],
    ['@jupyterlab/mathjax-extension/style/index.js', import('@jupyterlab/mathjax-extension/style/index.js')],
    ['@jupyterlab/notebook/style/index.js', import('@jupyterlab/notebook/style/index.js')],
    ['@jupyterlab/outputarea/style/index.js', import('@jupyterlab/outputarea/style/index.js')],
    ['@jupyterlab/rendermime/style/index.js', import('@jupyterlab/rendermime/style/index.js')],
    ['@jupyterlab/terminal/style/index.js', import('@jupyterlab/terminal/style/index.js')],
    ['@jupyterlab/ui-components/style/index.js', import('@jupyterlab/ui-components/style/index.js')],
    // ipywidgets.
    ['@jupyter-widgets/base/css/index.css', import('@jupyter-widgets/base/css/index.css')],
    ['@jupyter-widgets/controls/css/widgets-base.css', import('@jupyter-widgets/controls/css/widgets-base.css')],
  ];

  /*
   * `allSettled`, and emphatically not `Promise.all`.
   *
   * `Promise.all` rejects the instant any one of these rejects, and the
   * `.catch` that followed it then announced the stylesheets were ready while
   * the other fifteen were still in flight. A notebook waiting on this would
   * be released against a partial stylesheet — styled enough to look
   * deliberate, wrong enough to be unusable — and because the rejection was
   * swallowed, with nothing in the console to say so. `allSettled` waits for
   * every one of them however they end.
   */
  cssReady = Promise.allSettled(sheets.map(([, loading]) => loading)).then(
    results => {
      const failed = results
        .map((result, index) =>
          result.status === 'rejected' ? sheets[index][0] : null,
        )
        .filter((name): name is string => name !== null);
      if (failed.length > 0) {
        // Loudly. A stylesheet that does not arrive is the difference between
        // a notebook and a wall of unstyled text, and the previous silence
        // here is why that had to be diagnosed by reading rather than by
        // looking.
        console.error(
          `[jupyter-react] ${failed.length} JupyterLab stylesheet(s) failed to load; ` +
            'the notebook will render without them: ' +
            failed.join(', '),
        );
      }
      cssLoaded = true;
      for (const notify of cssListeners) {
        notify();
      }
    },
  );
  return cssReady;
}

let cssLoaded = false;

function subscribeToCss(notify: () => void): () => void {
  cssListeners.add(notify);
  return () => {
    cssListeners.delete(notify);
  };
}

/**
 * Whether the JupyterLab stylesheets are in the document yet.
 *
 * For components that are unreadable without them — a notebook, a console —
 * so they can hold their first paint instead of flashing an unstyled one.
 * Returns `true` synchronously once the sheets are in, so a second notebook on
 * the same page never waits.
 */
export function useJupyterLabCssLoaded(): boolean {
  useEffect(() => {
    void loadJupyterLabCss();
  }, []);
  return useSyncExternalStore(
    subscribeToCss,
    () => cssLoaded,
    // Server render: assume present rather than withhold content from a
    // crawler that will never run the effect.
    () => true
  );
}

/**
 * Components loading the JupyterLab CSS stylesheets.
 */
export function JupyterLabCss(props: JupyterLabCssProps): JSX.Element {
  const { colormode = 'light', manageThemeLinks = true } = props;
  useEffect(() => {
    void loadJupyterLabCss();
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
  /*
   * Whether *this* instance is the one that injected the variables.
   *
   * The cleanup below used to remove `style[data-jupyterlab-theme]` whatever
   * put it there. That is right for an instance undoing its own work — it
   * pinned a colormode, then discovered a JupyterLab owns the page, and gets
   * out of the way — and catastrophic for one that never injected anything:
   * it deletes the variables another, live theme is relying on, and the
   * notebook collapses to unstyled text in front of the reader.
   *
   * A component may only take back what it put there.
   */
  const injectedHere = useRef(false);

  useEffect(() => {
    if (manageThemeLinks || !injectedHere.current) {
      return;
    }
    document.body.querySelector(`style[${DATA_JUPYTERLAB_THEME}]`)?.remove();
    injectedHere.current = false;
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

    /*
     * Claim this run, so a later one can supersede it.
     *
     * This replaces a `disposed` flag set by the effect's own cleanup, and
     * the difference is the bug. The `--jp-*` variables are read from a
     * dynamically imported module, and if the effect was cleaned up before
     * that import resolved — a remount, a colormode that settled a beat
     * later — the injection was skipped and never attempted again, because
     * nothing re-runs an effect whose dependencies have not changed. The page
     * was then left with the structural JupyterLab CSS and none of the
     * variables: a notebook that lays out but is entirely unstyled, and
     * `style[data-jupyterlab-theme]` simply absent from the document.
     *
     * It only showed up where the tree was still churning when the notebook
     * mounted — arriving at a runtime page straight from creating the agent,
     * rather than from a list or a reload, where the notebook mounts into
     * something settled and the chunk is already cached.
     *
     * What must not happen is a *stale* colormode landing on top of a newer
     * one. That is an ordering question, and an epoch answers it exactly.
     */
    themeEpoch += 1;
    const epoch = themeEpoch;

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
        // Superseded only by a newer run, not by our own teardown.
        if (css && epoch === themeEpoch) {
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
          injectedHere.current = true;
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
