/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { useMemo } from 'react';
import { ThemeProvider, BaseStyles, Box, theme as primerTheme } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import defaultInjectableStore, { InjectableStore } from '../state/redux/Store';
import JupyterLabCss from './lab/JupyterLabCss';
import {
  getJupyterServerHttpUrl,
  getJupyterServerWsUrl,
  loadJupyterConfig,
} from './JupyterConfig';
import { ColorMode } from './lab/JupyterLabColorMode';
// import { jupyterTheme } from './theme';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children?: React.ReactNode;
  collaborative?: boolean;
  colorMode: ColorMode;
  defaultKernelName: string;
  disableCssLoading?: boolean;
  injectableStore?: InjectableStore;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  lite?: boolean;
  startDefaultKernel: boolean;
  theme: Theme;
  terminals?: boolean;
  useRunningKernelId?: string;
  useRunningKernelIndex?: number;
};

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
    colorMode,
    defaultKernelName,
    disableCssLoading,
    injectableStore,
    lite,
    startDefaultKernel,
    theme,
    useRunningKernelId,
    useRunningKernelIndex,
  } = props;
  const config = useMemo(() => {
    return loadJupyterConfig(props);
  }, [props]);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        console.log('Error Boundary reset has been invoked...');
      }}
    >
      <ThemeProvider
        theme={theme ?? primerTheme}
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
              baseUrl={getJupyterServerHttpUrl()}
              collaborative={collaborative}
              defaultKernelName={defaultKernelName}
              disableCssLoading={disableCssLoading}
              injectableStore={injectableStore || defaultInjectableStore}
              lite={lite}
              startDefaultKernel={startDefaultKernel}
              useRunningKernelId={useRunningKernelId}
              useRunningKernelIndex={useRunningKernelIndex ?? -1}
              variant="default"
              wsUrl={getJupyterServerWsUrl()}
            >
              {children}
            </JupyterContextProvider>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

Jupyter.defaultProps = {
  collaborative: false,
  colorMode: 'light',
  defaultKernelName: 'python',
  disableCssLoading: false,
  lite: false,
  startDefaultKernel: true,
  terminals: false,
  theme: primerTheme, // TODO Use jupyterTheme, see https://github.com/datalayer/jupyter-ui/issues/160
  useRunningKernelIndex: -1,
};

export default Jupyter;
