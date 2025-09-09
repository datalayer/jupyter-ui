/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
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
};

export function JupyterReactTheme(
  props: React.PropsWithChildren<IJupyterLabThemeProps>
): JSX.Element {
  const {
    children,
    colormode: colormodeProps = 'light',
    loadJupyterLabCss = true,
    theme = jupyterLabTheme,
  } = props;
  const [colormode, setColormode] = useState<Colormode>(colormodeProps);
  const { colormode: colormodeFromStore } = useJupyterReactStore();
  useEffect(() => {
    setColormode(colormodeProps);
  }, [colormodeProps]);
  useEffect(() => {
    setColormode(colormodeFromStore);
  }, [colormodeFromStore]);
  return (
    <JupyterReactColormodeContext.Provider value={colormode}>
      {loadJupyterLabCss && <JupyterLabCss colormode={colormode} />}
      <ThemeProvider
        theme={theme}
        colorMode={colormode === 'light' ? 'day' : 'night'}
        dayScheme="light"
        nightScheme="dark"
      >
        <BaseStyles
          style={{
            backgroundColor: 'var(--bgColor-default)',
            color: 'var(--fgColor-default)',
            fontSize: 'var(--text-body-size-medium)',
          }}
        >
          {children}
        </BaseStyles>
      </ThemeProvider>
    </JupyterReactColormodeContext.Provider>
  );
}

export default JupyterReactTheme;
