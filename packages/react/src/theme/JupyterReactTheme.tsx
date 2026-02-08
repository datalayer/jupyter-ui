/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, {
  createContext,
  CSSProperties,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { BaseStyles, ThemeProvider } from '@primer/react';
import { IThemeManager } from '@jupyterlab/apputils';
import { setupPrimerPortals } from '@datalayer/primer-addons';
import { Colormode, JupyterLabCss, jupyterLabTheme } from '../theme';
import { loadJupyterConfig } from '../jupyter';
import { useJupyterReactStore } from '../state';

import '@primer/primitives/dist/css/functional/themes/light.css';
import '@primer/primitives/dist/css/functional/themes/dark.css';

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

  // Detect JupyterLab synchronously — loadJupyterConfig() only reads the DOM,
  // no need to defer to an effect (which caused a blank first frame).
  const [inJupyterLab] = useState(() => {
    const { insideJupyterLab } = loadJupyterConfig();
    return insideJupyterLab;
  });

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
  // Store the resolved value, not 'auto'.
  useEffect(() => {
    const resolved = resolveColormode(colormodeProps);
    if (hasColormodeProp && colormodeFromStore !== resolved) {
      setColormodeStore(resolved);
      syncedRef.current = true;
    }
  }, [colormodeFromStore, colormodeProps, hasColormodeProp, setColormodeStore]);

  // Also sync prop to store eagerly on mount to avoid the initial 'light' frame
  if (hasColormodeProp && !syncedRef.current) {
    const resolved = resolveColormode(colormodeProps);
    if (colormodeFromStore !== resolved) {
      setColormodeStore(resolved);
      syncedRef.current = true;
    }
  }

  // Sync backgroundColor prop → store so notebook extensions (sidebars, etc.)
  // can read it from the store and render with the same background.
  useEffect(() => {
    setBackgroundColorStore(backgroundColor);
  }, [backgroundColor, setBackgroundColorStore]);

  useEffect(() => {
    function colorSchemeFromMedia({ matches }: { matches: boolean }) {
      // When colormode is 'auto', react to OS changes in real time.
      if (hasColormodeProp && colormodeProps === 'auto') {
        const resolved = matches ? 'dark' : 'light';
        setColormode(resolved);
        setupPrimerPortals(resolved);
      }
    }
    function updateColorMode(themeManager: IThemeManager) {
      if (hasColormodeProp) {
        return;
      }
      const colormode =
        themeManager.theme && !themeManager.isLight(themeManager.theme)
          ? 'dark'
          : 'light';
      setColormode(colormode);
      setupPrimerPortals(colormode);
    }
    if (inJupyterLab) {
      const themeManager = jupyterLabAdapter?.service(
        '@jupyterlab/apputils-extension:themes'
      ) as IThemeManager;
      if (themeManager) {
        updateColorMode(themeManager);
        themeManager.themeChanged.connect(updateColorMode);
        return () => {
          themeManager.themeChanged.disconnect(updateColorMode);
        };
      }
    } else {
      colorSchemeFromMedia({
        matches: window.matchMedia('(prefers-color-scheme: dark)').matches,
      });
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', colorSchemeFromMedia);
      return () => {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .removeEventListener('change', colorSchemeFromMedia);
      };
    }
  }, [inJupyterLab, jupyterLabAdapter, hasColormodeProp, colormodeProps]);
  return (
    <JupyterReactColormodeContext.Provider value={colormode}>
      {loadJupyterLabCss && <JupyterLabCss colormode={colormode} />}
      <ThemeProvider
        colorMode={colormode}
        theme={theme}
        dayScheme="light"
        nightScheme="dark"
      >
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
      </ThemeProvider>
    </JupyterReactColormodeContext.Provider>
  );
}

export default JupyterReactTheme;
