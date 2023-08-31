import React, { useEffect, useMemo } from 'react';
import { ThemeProvider, BaseStyles } from "@primer/react";
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import { getJupyterServerHttpUrl, getJupyterServerWsUrl, loadJupyterConfig } from './JupyterConfig';
import defaultInjectableStore, { InjectableStore } from '../state/redux/Store';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children: React.ReactNode;
  collaborative?: boolean;
  defaultKernelName: string;
  disableCssLoading?: boolean;
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
    useRunningKernelId, useRunningKernelIndex, children, disableCssLoading,
  } = props;
  const config = useMemo(() => loadJupyterConfig(props), []);
  useEffect(() => {
    if (!config.insideJupyterLab) {
      if (!disableCssLoading) {
        import("./lab/JupyterLabCss");
      }
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
            baseUrl={getJupyterServerHttpUrl()}
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
  disableCssLoading: false,
  lite: false,
  startDefaultKernel: true,
  terminals: false,
  useRunningKernelIndex: -1,
}

export default Jupyter;
