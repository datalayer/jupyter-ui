import React from 'react';
import { Store } from 'redux';
import { ThemeProvider, BaseStyles } from "@primer/react";
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import { getJupyterServerHttpUrl, getJupyterServerWsUrl, loadJupyterConfig } from './JupyterConfig';
import injectableStore from '../state/Store';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children: React.ReactNode;
  lite: boolean;
  startDefaultKernel: boolean;
  injectableStore?: Store | any;
  collaborative?: boolean;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  terminals?: boolean;
  theme?: any;
}

/**
 * The component to be used as fallback in case of error.
 */
const ErrorFallback = ({error, resetErrorBoundary}: any) => {
  return (
    <div role="alert">
      <p>Oops, something went wrong.</p>
      <pre>{error.message}</pre>
{/*
      <button onClick={resetErrorBoundary}>Try again</button>
*/}
    </div>
  )
}

/**
 * The Jupyter context. This handles the needed initialization
 * and ensure the Redux and the Material UI theme providers
 * are available.
 */
export const Jupyter = (props: JupyterProps) => {
  const { lite, startDefaultKernel } = props;
  loadJupyterConfig(props);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
//      onReset={() => { console.log('Reset has been invoked...'); }}
    >
      <ThemeProvider colorMode="day">
        <BaseStyles>
          <JupyterContextProvider
            lite={lite}
            startDefaultKernel={startDefaultKernel}
            baseUrl={getJupyterServerHttpUrl()}
            wsUrl={getJupyterServerWsUrl()}
            injectableStore={props.injectableStore || injectableStore}
            variant="default"
          >
            { props.children }
          </JupyterContextProvider>
        </BaseStyles>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

Jupyter.defaultProps = {
  lite: false,
  startDefaultKernel: true,
  collaborative: false,
  terminals: false,
}

export default Jupyter;
