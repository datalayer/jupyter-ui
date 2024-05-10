/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  BaseStyles,
  Box,
  ThemeProvider,
  theme as primerTheme,
} from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import {
  getJupyterServerHttpUrl,
  getJupyterServerWsUrl,
  loadJupyterConfig,
} from './JupyterConfig';
import { JupyterContextProps, JupyterContextProvider } from './JupyterContext';
import { ColorMode } from './lab/JupyterLabColorMode';
import JupyterLabCss from './lab/JupyterLabCss';

const requireJsScript = document.createElement('script');
requireJsScript.src =
  'https://cdnjs.cloudflare.com/ajax/libs/require.js/2.3.6/require.min.js';
document.body.appendChild(requireJsScript);

const cdnOnlyScript = document.createElement('script');
cdnOnlyScript.setAttribute('data-jupyter-widgets-cdn-only', 'true');
document.body.appendChild(cdnOnlyScript);

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = Omit<
  JupyterContextProps,
  'serverUrls' | 'variant'
> & {
  colorMode?: ColorMode;
  disableCssLoading?: boolean;
  jupyterServerHttpUrl?: string;
  jupyterServerWsUrl?: string;
  jupyterToken?: string;
  theme?: Theme;
  terminals?: boolean;
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
    colorMode = 'light',
    defaultKernelName,
    disableCssLoading = false,
    initCode = '',
    injectableStore,
    jupyterServerHttpUrl,
    jupyterServerWsUrl,
    jupyterToken,
    lite,
    startDefaultKernel,
    skeleton,
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
      lite,
      terminals,
    });
  }, [
    collaborative,
    jupyterServerHttpUrl,
    jupyterServerWsUrl,
    jupyterToken,
    lite,
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
              initCode={initCode}
              lite={lite}
              serverUrls={{
                baseUrl: getJupyterServerHttpUrl(),
                wsUrl: getJupyterServerWsUrl(),
              }}
              skeleton={skeleton}
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
