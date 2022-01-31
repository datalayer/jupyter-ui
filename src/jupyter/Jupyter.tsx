import React from 'react';
import { PageConfig } from '@jupyterlab/coreutils';
import { Store } from 'redux';
import { ErrorBoundary } from 'react-error-boundary'
import injectableStore from '../state/InjectableStore';
import { JupyterContextProvider } from './JupyterContext';
import { loadJupyterConfig, getJupyterServerHttpUrl, getJupyterServerWsUrl, getJupyterToken } from './JupyterConfig';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
type JupyterProps = {
  children: React.ReactNode;
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
const Jupyter = (props: JupyterProps) => {
  loadJupyterConfig();
  const baseUrl = props.jupyterServerHttpUrl || getJupyterServerHttpUrl()
  PageConfig.setOption('baseUrl', baseUrl);
  PageConfig.setOption('collaborative', String(props.collaborative || false));
  PageConfig.setOption('mathjaxUrl', 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js');
  PageConfig.setOption('mathjaxConfig', 'TeX-AMS_CHTML-full,Safe');
  PageConfig.setOption('terminalsAvailable', String(props.terminals || false));
  PageConfig.setOption('token', props.jupyterToken || getJupyterToken());
  const wsUrl = props.jupyterServerWsUrl || getJupyterServerWsUrl();
  PageConfig.setOption('wsUrl', wsUrl);
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        console.log('The reset button has been clicked...');
      }}
    >
      <JupyterContextProvider
        variant="default"
        baseUrl = {baseUrl}
        wsUrl = {wsUrl}
        injectableStore={props.injectableStore || injectableStore}
        >
        { props.children }
      </JupyterContextProvider>
    </ErrorBoundary>
  )
}

export default Jupyter;
