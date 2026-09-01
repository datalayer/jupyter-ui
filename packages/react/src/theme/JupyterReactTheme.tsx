/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import React, {
  createContext,
  CSSProperties,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { BaseStyles, ThemeProvider } from '@primer/react';
import { IThemeManager } from '@jupyterlab/apputils';
import { setupPrimerPortals } from '@datalayer/primer-addons';
import { refreshJupyterLabPortalTheme } from './JupyterLabPortalTheme';
import { Colormode, JupyterLabCss, jupyterLabTheme } from '../theme';
import { ensureJupyterConfig, isServedByJupyterLab } from '../jupyter';
import { useJupyterReactStore } from '../state';

import '@primer/primitives/dist/css/functional/themes/light.css';
import '@primer/primitives/dist/css/functional/themes/dark.css';

// Color-mode-aware scrollbar styles for JupyterLab containers.
// Must be loaded alongside the theme since it relies on [data-color-mode].
import '../../style/base.css';

import '@primer/primitives/dist/css/base/typography/typography.css';
import '@primer/primitives/dist/css/functional/size/border.css';
import '@primer/primitives/dist/css/functional/size/breakpoints.css';
import '@primer/primitives/dist/css/functional/size/size-coarse.css';
import '@primer/primitives/dist/css/functional/size/size-fine.css';
import '@primer/primitives/dist/css/functional/size/size.css';
import '@primer/primitives/dist/css/functional/size/viewport.css';
import '@primer/primitives/dist/css/functional/typography/typography.css';

// Create context for colormode
const JupyterReactColormodeContext = createContext<Colormode | undefined>(
  undefined
);

// Hook to access the colormode from the context
export function useJupyterReactColormode(): Colormode {
  const colormode = useContext(JupyterReactColormodeContext);
  if (colormode === undefined) {
    throw new Error(
      'useJupyterReactColormode must be used within a JupyterReactTheme provider'
    );
  }
  return colormode;
}

export type IJupyterLabThemeProps = {
  colormode?: Colormode;
  loadJupyterLabCss?: boolean;
  theme?: Record<string, any>;
  /**
   * Whether to wrap children in Primer BaseStyles.
   * Disable this when an outer provider already applies BaseStyles
   * (e.g. DatalayerThemeProvider) to avoid resetting font tokens.
   */
  useBaseStyles?: boolean;
  /**
   * Base styles
   */
  baseStyles?: CSSProperties;
  /**
   * Background color override. When provided, this replaces the default
   * `var(--bgColor-default)` so each theme can set its own background.
   */
  backgroundColor?: string;
};

/**
 * ThemeProvider component changing color mode with JupyterLab theme
 * if embedded in Jupyter or with the browser color scheme preference.
 */
export function JupyterReactTheme(
  props: React.PropsWithChildren<IJupyterLabThemeProps>
): JSX.Element {
  const {
    children,
    colormode: colormodeProps = 'light',
    loadJupyterLabCss = true,
    theme = jupyterLabTheme,
    useBaseStyles = true,
    backgroundColor,
    ...rest
  } = props;
  const {
    colormode: colormodeFromStore,
    setColormode: setColormodeStore,
    setBackgroundColor: setBackgroundColorStore,
    jupyterLabAdapter,
  } = useJupyterReactStore();
  const hasColormodeProp = 'colormode' in props;

  // Resolve 'auto' → actual OS preference ('light' or 'dark').
  const resolveColormode = (cm: Colormode): 'light' | 'dark' => {
    if (cm === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return cm;
  };

  /*
   * Detect JupyterLab synchronously, without touching anything.
   *
   * It used to ask `loadJupyterConfig()`, on the stated grounds that the call
   * "only reads the DOM". It does not: it rebuilds the module configuration
   * and writes `baseUrl` and `wsUrl` into the shared `PageConfig`. So every
   * render of this theme quietly repointed the whole page at the server named
   * in `jupyter-config-data` — which broke an in-page JupyterLite kernel that
   * had pointed the page at its own origin moments earlier, with cells that
   * ran into silence and no error anywhere to say why.
   *
   * `isServedByJupyterLab` answers the same question and writes nothing.
   */
  const [inJupyterLab] = useState(() => {
    /*
     * Building the configuration is the half of `loadJupyterConfig` that was
     * always wanted here. Removing that call to stop it repointing the page
     * also stopped the singleton being built — and nothing else in this
     * package builds it, so four accessors began throwing. `ensureJupyterConfig`
     * writes nothing to `PageConfig`.
     */
    ensureJupyterConfig();
    return isServedByJupyterLab();
  });
  /**
   * Whether a JupyterLab of this page has applied a theme.
   *
   * The theme manager states what it applied on the body of the document —
   * `data-jp-theme-light` and `data-jp-theme-name` — and restates it on every
   * change. That is the whole signal, and it asks nothing of the application:
   * a view rendered by an extension has no application object at hand, and
   * the one it can read from the store arrives whenever the plugin that puts
   * it there happens to activate. It is also what says the `--jp-*` variables
   * of the page belong to JupyterLab and must not be written over.
   */
  const jupyterLabColormode = (): 'light' | 'dark' | undefined => {
    const light = document.body.dataset.jpThemeLight;
    if (light === undefined) {
      return undefined;
    }
    return light === 'false' ? 'dark' : 'light';
  };
  const [jupyterLabThemed, setJupyterLabThemed] = useState(
    () => jupyterLabColormode() !== undefined
  );

  // Determine the effective colormode:
  // - If a colormode prop is passed, it takes priority (external control)
  // - Otherwise, follow the Zustand store (internal/store control)
  // Then resolve 'auto' to the actual OS preference.
  const effectiveColormode = resolveColormode(
    hasColormodeProp ? colormodeProps : colormodeFromStore
  );
  const [colormode, setColormode] = useState(effectiveColormode);

  // Keep a ref to track if we've synced the prop to the store to avoid
  // redundant store updates that trigger re-renders.
  const syncedRef = useRef(false);

  // Sync prop → local state when prop changes (always resolve 'auto')
  useEffect(() => {
    const resolved = resolveColormode(
      hasColormodeProp ? colormodeProps : colormodeFromStore
    );
    if (colormode !== resolved) {
      setColormode(resolved);
    }
  }, [colormodeFromStore, colormode, colormodeProps, hasColormodeProp]);

  // Sync prop → store (so children reading the store directly also get the right value)
  // Store the resolved value, not 'auto'. Use useLayoutEffect so the store is
  // updated before the first paint, avoiding an initial 'light' flash without
  // performing a setState during render (which causes a React warning when an
  // ancestor subscribes to the same store).
  useLayoutEffect(() => {
    if (!hasColormodeProp) {
      return;
    }
    const resolved = resolveColormode(colormodeProps);
    if (colormodeFromStore !== resolved) {
      setColormodeStore(resolved);
    }
    syncedRef.current = true;
  }, [colormodeFromStore, colormodeProps, hasColormodeProp, setColormodeStore]);

  // Sync backgroundColor prop → store so notebook extensions (sidebars, etc.)
  // can read it from the store and render with the same background.
  useEffect(() => {
    setBackgroundColorStore(backgroundColor);
  }, [backgroundColor, setBackgroundColorStore]);

  /**
   * Follow the color mode of the surroundings, or impose the one asked for.
   *
   * Three cases, in this order:
   *
   * - a `colormode` property is given: it wins, and JupyterLab is told about
   *   it — leaving its theme alone would keep the `--jp-*` variables of the
   *   other one;
   * - the page is a JupyterLab, or holds one: its theme rules, and every
   *   change of it is followed — through what the theme manager states on the
   *   body, which is there whether or not this page can reach the plugin that
   *   provides the manager, and whenever that plugin activated;
   * - neither: the preference of the operating system.
   *
   * The resolved mode is written to the store, which is what the components
   * rendered outside of this provider — the views of an extension, the
   * portals of Primer — read.
   */
  useEffect(() => {
    let disconnect: (() => void) | undefined;

    /*
     * The overlays of the page are not turned into JupyterLab ones here.
     *
     * Primer draws every overlay of the document under ONE root, so what is
     * written on it is written for the whole page — and this provider is
     * mounted by whoever shows a notebook, which is not the same thing as
     * the page being a JupyterLab. A web application showing a notebook
     * among its own pages had its own menus and its own dialogs repainted
     * in the theme of JupyterLab, and left that way. A JupyterLab asks for
     * that bridge from its entry point instead; what is said here is only
     * that a themed view has rendered — the moment the rules the bridge
     * copies are written — which does nothing at all on a page that never
     * asked for it. See `JupyterLabPortalTheme`.
     */
    const applyColormode = (resolved: 'light' | 'dark') => {
      setColormode(resolved);
      if (colormodeFromStore !== resolved) {
        setColormodeStore(resolved);
      }
      setupPrimerPortals(resolved);
      refreshJupyterLabPortalTheme();
    };
    const followSystem = (): (() => void) => {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const colorSchemeFromMedia = ({ matches }: { matches: boolean }) => {
        applyColormode(matches ? 'dark' : 'light');
      };
      colorSchemeFromMedia({ matches: media.matches });
      media.addEventListener('change', colorSchemeFromMedia);
      return () => {
        media.removeEventListener('change', colorSchemeFromMedia);
      };
    };
    const followJupyterLab = (): (() => void) => {
      let stopFollowingSystem: (() => void) | undefined;
      const apply = () => {
        const resolved = jupyterLabColormode();
        if (!resolved) {
          return;
        }
        setJupyterLabThemed(true);
        stopFollowingSystem?.();
        stopFollowingSystem = undefined;
        applyColormode(resolved);
      };
      // The attributes of the body, not the theme manager: what the theme
      // manager applied is on the body whether or not this page can reach the
      // plugin that provides it, and it is rewritten on every change.
      const observer = new MutationObserver(apply);
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-jp-theme-light', 'data-jp-theme-name'],
      });
      apply();
      if (!jupyterLabColormode()) {
        // The application has not themed itself yet — the preference of the
        // system stands in until it does, and gives way when it does.
        stopFollowingSystem = followSystem();
      }
      return () => {
        observer.disconnect();
        stopFollowingSystem?.();
      };
    };
    const themeManagerOf = (): IThemeManager | undefined =>
      (jupyterLabAdapter?.service(
        '@jupyterlab/apputils-extension:themes'
      ) as IThemeManager | null) ?? undefined;

    if (hasColormodeProp) {
      // The property wins, and JupyterLab is told about it — leaving its theme
      // alone would keep the `--jp-*` variables of the other one.
      const resolved = resolveColormode(colormodeProps);
      const desiredTheme =
        resolved === 'dark' ? 'JupyterLab Dark' : 'JupyterLab Light';
      const themeManager = themeManagerOf();
      if (themeManager && themeManager.theme !== desiredTheme) {
        themeManager.setTheme(desiredTheme).catch(() => {
          /* swallow — best effort */
        });
      }
      setupPrimerPortals(resolved);
      refreshJupyterLabPortalTheme();
      if (!jupyterLabAdapter && colormodeProps === 'auto') {
        disconnect = followSystem();
      }
    } else if (inJupyterLab || jupyterLabThemed || jupyterLabAdapter) {
      // The page is a JupyterLab, or holds one: its theme rules, and every
      // change of it is followed.
      disconnect = followJupyterLab();
    } else {
      disconnect = followSystem();
    }
    return () => {
      disconnect?.();
    };
  }, [
    inJupyterLab,
    jupyterLabAdapter,
    jupyterLabThemed,
    hasColormodeProp,
    colormodeProps,
    colormodeFromStore,
    setColormodeStore,
  ]);
  return (
    <JupyterReactColormodeContext.Provider value={colormode}>
      {loadJupyterLabCss && (
        <JupyterLabCss
          colormode={colormode}
          // When an explicit colormode prop is provided, force theme-link
          // management even if a JupyterLabAdapter is present — otherwise the
          // server-loaded JupyterLab theme variables would override our
          // requested colormode.
          manageThemeLinks={
            hasColormodeProp ||
            !(jupyterLabAdapter || inJupyterLab || jupyterLabThemed)
          }
        />
      )}
      <ThemeProvider
        colorMode={colormode}
        theme={theme}
        dayScheme="light"
        nightScheme="dark"
      >
        {useBaseStyles ? (
          <BaseStyles
            style={{
              backgroundColor: backgroundColor ?? 'var(--bgColor-default)',
              color: 'var(--fgColor-default)',
              fontSize: 'var(--text-body-size-medium)',
            }}
            {...rest}
          >
            {backgroundColor && (
              <style>{`.jp-Notebook { background-color: ${backgroundColor} !important; }`}</style>
            )}
            {children}
          </BaseStyles>
        ) : (
          <div
            style={{
              backgroundColor: backgroundColor ?? 'var(--bgColor-default)',
              color: 'var(--fgColor-default)',
              fontSize: 'var(--text-body-size-medium)',
            }}
          >
            {backgroundColor && (
              <style>{`.jp-Notebook { background-color: ${backgroundColor} !important; }`}</style>
            )}
            {children}
          </div>
        )}
      </ThemeProvider>
    </JupyterReactColormodeContext.Provider>
  );
}

export default JupyterReactTheme;
