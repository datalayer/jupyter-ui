/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider, theme } from '@primer/react';
import { Colormode, JupyterLabCss } from './../theme';

type IJupyterLabThemeProps = {
  colormode: Colormode;
}

export const JupyterReactTheme = (props: React.PropsWithChildren<IJupyterLabThemeProps>) => {
  const { children, colormode } = props;
  return (
    <>
      <JupyterLabCss colormode={colormode} />
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
} as IJupyterLabThemeProps;

export default JupyterReactTheme;
