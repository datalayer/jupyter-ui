/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider, theme } from '@primer/react';
import { Colormode, JupyterLabCss } from './../theme';

type IJupyterLabThemeProps = {
  colormode: Colormode;
  loadJupyterLabCss: boolean;
}

export const JupyterReactTheme = (props: React.PropsWithChildren<IJupyterLabThemeProps>) => {
  const { children, colormode, loadJupyterLabCss } = props;
  return (
    <>
      { loadJupyterLabCss && <JupyterLabCss colormode={colormode} /> }
      <ThemeProvider
        theme={theme}
        colorMode={colormode === 'light' ? 'day' : 'night'}
        dayScheme="light"
        nightScheme="dark"
      >
        <BaseStyles>
          {children}
        </BaseStyles>
      </ThemeProvider>
    </>
  )
}

JupyterReactTheme.defaultProps = {
  colormode: 'light',
  loadJupyterLabCss: true,
} as IJupyterLabThemeProps;

export default JupyterReactTheme;
