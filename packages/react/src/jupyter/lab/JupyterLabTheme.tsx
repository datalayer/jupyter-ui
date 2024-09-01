/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider, theme } from '@primer/react';
import JupyterLabCss from './JupyterLabCss';
import { ColorMode } from './JupyterLabColorMode';

type IJupyterLabThemeProps = {
  colorMode: ColorMode;
}

export const JupyterLabTheme = (props: React.PropsWithChildren<IJupyterLabThemeProps>) => {
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

JupyterLabTheme.defaultProps = {
  colorMode: 'light',
} as IJupyterLabThemeProps;

export default JupyterLabTheme;
