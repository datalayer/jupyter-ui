/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider, theme } from '@primer/react';
import { ColorMode, JupyterLabCss } from './../jupyter';

type IJupyterLabThemeProps = {
  colorMode: ColorMode;
}

export const JupyterReactTheme = (props: React.PropsWithChildren<IJupyterLabThemeProps>) => {
  const { children, colorMode } = props;
  return (
    <>
      <JupyterLabCss colorMode={colorMode} />
      <ThemeProvider
        theme={theme}
        colorMode={colorMode === 'light' ? 'day' : 'night'}
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
  colorMode: 'light',
} as IJupyterLabThemeProps;

export default JupyterReactTheme;
