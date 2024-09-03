/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BaseStyles, Box, ThemeProvider, theme as primerTheme } from '@primer/react';
import { Theme } from '@primer/react/lib/ThemeProvider';
import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { loadJupyterConfig } from './JupyterConfig';
import { JupyterContextProps, JupyterContextProvider } from './JupyterContext';
import { ColorMode } from './lab/JupyterLabColorMode';
import JupyterLabCss from './lab/JupyterLabCss';

/**
 * Definition of the properties that can be passed
 * when creating a Jupyter context.
 */
export type JupyterProps = Omit<
  JupyterContextProps,
  'variant'
> & {
  colorMode?: ColorMode;
  disableCssLoading?: boolean;
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
 * and ensure the Primer theme providers is available.
 */
export const Jupyter = (props: JupyterProps) => {
  const {
    children,
    collaborative,
    colorMode = 'light',
    defaultKernelName,
    disableCssLoading = false,
    initCode = '',
    jupyterServerUrl,
    jupyterServerToken,
    lite,
    serverless,
    serviceManager,
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
      jupyterServerUrl,
      jupyterServerToken,
      lite,
      terminals,
    });
  }, [
    collaborative,
    jupyterServerUrl,
    jupyterServerToken,
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
              initCode={initCode}
              lite={lite}
              serverless={serverless}
              serviceManager={serviceManager}
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
