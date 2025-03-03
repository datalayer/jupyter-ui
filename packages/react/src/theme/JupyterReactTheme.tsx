/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { Colormode, JupyterLabCss, jupyterLabTheme } from './../theme';

type IJupyterLabThemeProps = {
  colormode: Colormode;
  loadJupyterLabCss: boolean;
  theme?: Theme;
}

export const JupyterReactTheme = (props: React.PropsWithChildren<IJupyterLabThemeProps>) => {
  const { children, colormode, loadJupyterLabCss, theme } = props;
  return (
    <>
      { loadJupyterLabCss && <JupyterLabCss colormode={colormode} /> }
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
    </>
  )
}

JupyterReactTheme.defaultProps = {
  colormode: 'light',
  loadJupyterLabCss: true,
  theme: jupyterLabTheme,
} as IJupyterLabThemeProps;

export default JupyterReactTheme;
