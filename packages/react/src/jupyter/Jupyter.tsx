import React from 'react';
import { ThemeProvider, BaseStyles } from "@primer/react";
import { ErrorBoundary } from 'react-error-boundary';
import { JupyterContextProvider } from './JupyterContext';
import { getJupyterServerHttpUrl, getJupyterServerWsUrl, loadJupyterConfig } from './JupyterConfig';
import defaultInjectableStore, { InjectableStore } from '../redux/Store';

import '@lumino/widgets/style/index.css';
import '@lumino/dragdrop/style/index.css';

import '@jupyterlab/ui-components/style/base.css';
import '@jupyterlab/apputils/style/base.css';
import '@jupyterlab/rendermime/style/base.css';
import '@jupyterlab/codeeditor/style/base.css';
import '@jupyterlab/documentsearch/style/base.css';
import '@jupyterlab/outputarea/style/base.css';
import '@jupyterlab/console/style/base.css';
import '@jupyterlab/completer/style/base.css';
import '@jupyterlab/codemirror/style/base.css';
import '@jupyterlab/codeeditor/style/base.css';
import '@jupyterlab/cells/style/base.css';
import '@jupyterlab/notebook/style/base.css';
import '@jupyterlab/filebrowser/style/base.css';
import '@jupyterlab/terminal/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';
import '@jupyter-widgets/base/css/index.css';
import '@jupyter-widgets/controls/css/widgets-base.css';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = {
  children: React.ReactNode;
  lite: boolean;
  startDefaultKernel: boolean;
  defaultKernelName: string;
  useRunningKernelId?: string;
  useRunningKernelIndex?: number;
  injectableStore?: InjectableStore;
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
    useRunningKernelId, useRunningKernelIndex, children
  } = props;
  loadJupyterConfig(props);
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
  lite: false,
  defaultKernelName: 'python',
  startDefaultKernel: true,
  collaborative: false,
  terminals: false,
  useRunningKernelIndex: -1,
}

export default Jupyter;
