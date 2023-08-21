import React, { useEffect, useMemo } from 'react';
import { ThemeProvider, BaseStyles } from "@primer/react";
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import { getJupyterServerHttpUrl, getJupyterServerWsUrl, loadJupyterConfig } from './JupyterConfig';
import defaultInjectableStore, { InjectableStore } from '../redux/Store';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children: React.ReactNode;
  collaborative?: boolean;
  defaultKernelName: string;
  injectableStore?: InjectableStore;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  lite: boolean;
  startDefaultKernel: boolean;
  terminals?: boolean;
  theme?: any;
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
    lite, startDefaultKernel, defaultKernelName, injectableStore,
    useRunningKernelId, useRunningKernelIndex, children,
  } = props;
  const config = useMemo(() => loadJupyterConfig(props), []);
  useEffect(() => {
    if (!config.insideJupyterLab) {
      import("./lab/JupyterLabCss");
    }  
  }, [config]);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => { console.log('Error Boundary reset has been invoked...'); }}
    >
      <ThemeProvider colorMode="day">
        <BaseStyles>
          <JupyterContextProvider
            lite={lite}
            startDefaultKernel={startDefaultKernel}
            defaultKernelName={defaultKernelName}
            useRunningKernelId={useRunningKernelId}
            useRunningKernelIndex={useRunningKernelIndex}
            baseUrl={getJupyterServerHttpUrl()}
            wsUrl={getJupyterServerWsUrl()}
            injectableStore={injectableStore || defaultInjectableStore}
            variant="default"
          >
            { children }
          </JupyterContextProvider>
        </BaseStyles>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

Jupyter.defaultProps = {
  collaborative: false,
  defaultKernelName: 'python',
  lite: false,
  startDefaultKernel: true,
  terminals: false,
  useRunningKernelIndex: -1,
}

export default Jupyter;
