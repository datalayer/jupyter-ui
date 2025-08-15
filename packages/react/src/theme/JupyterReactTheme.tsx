/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, ThemeProvider } from '@primer/react';
import { Colormode, JupyterLabCss, jupyterLabTheme } from '../theme';

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
    colormode = 'light',
    loadJupyterLabCss = true,
    theme = jupyterLabTheme,
  } = props;
  return (
    <>
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
    </>
  );
}

export default JupyterReactTheme;
