/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import React, { useMemo } from 'react';
import { ThemeProvider, BaseStyles, Box } from "@primer/react";
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import JupyterLabCss  from './lab/JupyterLabCss';
import { getJupyterServerHttpUrl, getJupyterServerWsUrl, loadJupyterConfig } from './JupyterConfig';
import defaultInjectableStore, { InjectableStore } from '../state/redux/Store';
import { JupyterLabTheme } from "./lab/JupyterLabTheme";
import defaultTheme from './theme';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children?: React.ReactNode;
  collaborative?: boolean;
  defaultKernelName: string;
  disableCssLoading?: boolean;
  injectableStore?: InjectableStore;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  lite?: boolean;
  startDefaultKernel: boolean;
  terminals?: boolean;
  theme: JupyterLabTheme;
  useRunningKernelId?: string;
  useRunningKernelIndex?: number;
}

/**
 * The component to be used as fallback in case of error.
 */
const ErrorFallback = ({error, resetErrorBoundary}: any) => {
  return (
    <div role="alert">
      <p>Oops, something went wrong.</p>
      <pre>{error.message}</pre>
      <div style={{ visibility: "hidden" }}>
        <button onClick={resetErrorBoundary}>Try again</button>
      </div>
    </div>
  )
}

/**
 * The Jupyter context. This handles the needed initialization
 * and ensure the Redux and the Material UI theme providers
 * are available.
 */
export const Jupyter = (props: JupyterProps) => {
  const {
    lite, collaborative, startDefaultKernel, defaultKernelName, injectableStore, theme,
    useRunningKernelId, useRunningKernelIndex, children, disableCssLoading,
  } = props;
  const config = useMemo(() => {
    return loadJupyterConfig(props);
  }, [props]);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => { console.log('Error Boundary reset has been invoked...'); }}
    >
      <ThemeProvider theme={defaultTheme} colorMode={theme === 'light' ? 'day' : 'night'} dayScheme='jupyter' nightScheme='jupyter'>
        <BaseStyles>
          <Box color="fg.default" bg="canvas.default">
            { !config.insideJupyterLab && !disableCssLoading && <JupyterLabCss theme={theme}/> }
            <JupyterContextProvider
              baseUrl={getJupyterServerHttpUrl()}
              collaborative={collaborative}
              defaultKernelName={defaultKernelName}
              disableCssLoading={disableCssLoading}
              injectableStore={injectableStore || defaultInjectableStore}
              lite={lite}
              startDefaultKernel={startDefaultKernel}
              theme={theme}
              useRunningKernelId={useRunningKernelId}
              useRunningKernelIndex={useRunningKernelIndex ?? -1}
              variant="default"
              wsUrl={getJupyterServerWsUrl()}
            >
              { children }
            </JupyterContextProvider>
          </Box>
        </BaseStyles>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

Jupyter.defaultProps = {
  collaborative: false,
  defaultKernelName: 'python',
  disableCssLoading: false,
  lite: false,
  startDefaultKernel: true,
  terminals: false,
  theme: 'light',
  useRunningKernelIndex: -1,
}

export default Jupyter;
