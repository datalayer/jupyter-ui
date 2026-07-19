/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { PropsWithChildren } from 'react';
import { DatalayerThemeProvider } from '@datalayer/primer-addons';
import {
  JupyterReactTheme,
  type IJupyterLabThemeProps,
} from '../theme/JupyterReactTheme';
import { useExampleThemeSettings } from './themeStore';

type ExampleJupyterReactThemeProps = Omit<
  IJupyterLabThemeProps,
  'colormode' | 'backgroundColor'
>;

/**
 * Wrap examples with shared Primer/Jupyter theme settings from the examples store.
 */
export const ExampleJupyterReactTheme = ({
  children,
  ...rest
}: PropsWithChildren<ExampleJupyterReactThemeProps>) => {
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();

  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme
        colormode={resolvedMode}
        backgroundColor={backgroundColor}
        useBaseStyles={false}
        {...rest}
      >
        {children}
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

export default ExampleJupyterReactTheme;
