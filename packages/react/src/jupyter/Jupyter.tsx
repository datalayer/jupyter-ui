/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { JupyterLiteServerPlugin } from '@jupyterlite/server';
import {
  BaseStyles,
  Box,
  ThemeProvider,
  theme as primerTheme,
} from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { InjectableStore } from '../state/redux/Store';
import {
  getJupyterServerHttpUrl,
  getJupyterServerWsUrl,
  loadJupyterConfig,
} from './JupyterConfig';
import { JupyterContextProvider } from './JupyterContext';
import { ColorMode } from './lab/JupyterLabColorMode';
import JupyterLabCss from './lab/JupyterLabCss';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = React.PropsWithChildren<{
  collaborative?: boolean;
  colorMode?: ColorMode;
  defaultKernelName?: string;
  disableCssLoading?: boolean;
  injectableStore?: InjectableStore;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  /**
   * Whether to run Jupyter within the browser or not.
   */
  browserKernelModule?:
    | boolean
    | Promise<{ default: JupyterLiteServerPlugin<any>[] }>;
  startDefaultKernel?: boolean;
  theme?: Theme;
  terminals?: boolean;
  useRunningKernelId?: string;
  useRunningKernelIndex?: number;
}>;

/**
 * The component to be used as fallback in case of error.
 */
const ErrorFallback = ({ error, resetErrorBoundary }: any) => {
  return (
    <div role="alert">
      <p>Oops, something went wrong.</p>
      <pre>{error.message}</pre>
      <div style={{ visibility: 'hidden' }}>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    </div>
  );
};

/**
 * The Jupyter context. This handles the needed initialization
 * and ensure the Redux and the Material UI theme providers
 * are available.
 */
export const Jupyter = (props: JupyterProps) => {
  const {
    children,
    collaborative,
    colorMode = 'light',
    defaultKernelName,
    disableCssLoading = false,
    injectableStore,
    jupyterServerHttpUrl,
    jupyterServerWsUrl,
    jupyterToken,
    browserKernelModule,
    startDefaultKernel,
    terminals = false,
    theme = primerTheme,
    useRunningKernelId,
    useRunningKernelIndex,
  } = props;

  const config = useMemo(() => {
    return loadJupyterConfig({
      collaborative,
      jupyterServerHttpUrl,
      jupyterServerWsUrl,
      jupyterToken,
      browserKernelModule,
      terminals,
    });
  }, [
    collaborative,
    jupyterServerHttpUrl,
    jupyterServerWsUrl,
    jupyterToken,
    browserKernelModule,
    terminals,
  ]);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        console.log('Error Boundary reset has been invoked...');
      }}
    >
      <ThemeProvider
        theme={theme}
        colorMode={colorMode === 'light' ? 'day' : 'night'}
        dayScheme="light"
        nightScheme="dark"
      >
        <BaseStyles>
          <Box color="fg.default" bg="canvas.default">
            {!config.insideJupyterLab && !disableCssLoading && (
              <JupyterLabCss colorMode={colorMode} />
            )}
            <JupyterContextProvider
              collaborative={collaborative}
              defaultKernelName={defaultKernelName}
              injectableStore={injectableStore}
              browserKernelModule={browserKernelModule}
              serverUrls={{
                baseUrl: getJupyterServerHttpUrl(),
                wsUrl: getJupyterServerWsUrl(),
              }}
              startDefaultKernel={startDefaultKernel}
              useRunningKernelId={useRunningKernelId}
              useRunningKernelIndex={useRunningKernelIndex}
            >
              {children}
            </JupyterContextProvider>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default Jupyter;
