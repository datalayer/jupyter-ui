/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '@datalayer/jupyter-react';
import { useJupyter } from '@datalayer/jupyter-react';
import {
  CellSidebarExtension,
  CellSidebarButton,
  KernelIndicator,
  Notebook,
} from '@datalayer/jupyter-react';

import { useExampleThemeSettings } from './themeStore';

import '@datalayer/jupyter-react/style/index.css';

import NBFORMAT from './content/Example.ipynb.json';

const NotebookExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();
  const extensions = useMemo(
    () => [new CellSidebarExtension({ factory: CellSidebarButton })],
    [],
  );
  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme
        colormode={resolvedMode}
        backgroundColor={backgroundColor}
      >
        {serviceManager && defaultKernel && (
          <>
            <Box>
              <KernelIndicator
                kernel={defaultKernel?.connection}
                label="Kernel Indicator"
              />
            </Box>
            <Notebook
              nbformat={NBFORMAT as INotebookContent}
              id="notebook2-nbformat-id"
              kernel={defaultKernel}
              serviceManager={serviceManager}
              height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
              extensions={extensions}
            />
          </>
        )}
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

export default NotebookExample;
