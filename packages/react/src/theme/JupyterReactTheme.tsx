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
  useState,
} from 'react';
import { BaseStyles, ThemeProvider } from '@primer/react';
import { Colormode, JupyterLabCss, jupyterLabTheme } from '../theme';
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
import { IThemeManager } from '@jupyterlab/apputils';
import { loadJupyterConfig } from '../jupyter';

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

type IJupyterLabThemeProps = {
  colormode?: Colormode;
  loadJupyterLabCss?: boolean;
  theme?: Record<string, any>;
  /**
   * Base styles
   */
  baseStyles?: CSSProperties;
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
    ...rest
  } = props;
  const { colormode: colormodeFromStore, jupyterLabAdapter } =
    useJupyterReactStore();
  const [colormode, setColormode] = useState(colormodeProps ?? 'light');
  const [inJupyterLab, setInJupterLab] = useState<boolean | undefined>(
    undefined
  );
  useEffect(() => {
    const { insideJupyterLab } = loadJupyterConfig();
    setInJupterLab(insideJupyterLab);
  }, []);
  useEffect(() => {
    if (colormodeFromStore !== colormode) {
      setColormode(colormodeFromStore);
    } else if (colormodeProps !== colormode) {
      setColormode(colormodeProps);
    }
  }, [colormodeProps, colormodeFromStore, inJupyterLab]);
  useEffect(() => {
    if (inJupyterLab !== undefined) {
      function colorSchemeFromMedia({ matches }: { matches: boolean }) {
        setColormode(matches ? 'dark' : 'light');
      }
      function updateColorMode(themeManager: IThemeManager) {
        setColormode(
          themeManager.theme && !themeManager.isLight(themeManager.theme)
            ? 'dark'
            : 'light'
        );
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
    }
  }, [inJupyterLab, jupyterLabAdapter]);
  return inJupyterLab !== undefined ? (
    <JupyterReactColormodeContext.Provider value={colormode}>
      {loadJupyterLabCss && <JupyterLabCss colormode={colormode} />}
      <ThemeProvider
        colorMode={colormode === 'light' ? 'day' : 'night'}
        theme={theme}
        dayScheme="light"
        nightScheme="dark"
      >
        <BaseStyles
          style={{
            backgroundColor: 'var(--bgColor-default)',
            color: 'var(--fgColor-default)',
            fontSize: 'var(--text-body-size-medium)',
          }}
          {...rest}
        >
          {children}
        </BaseStyles>
      </ThemeProvider>
    </JupyterReactColormodeContext.Provider>
  ) : (
    <></>
  );
}

export default JupyterReactTheme;
