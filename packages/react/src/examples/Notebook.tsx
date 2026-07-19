/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter';
import {
  CellSidebarExtension,
  CellSidebarButton,
  KernelIndicator,
  Notebook,
} from '../components';
import { CellToolbarExtension } from './extensions';
import { useExampleThemeSettings } from './themeStore';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();
  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
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
        useBaseStyles={false}
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

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookExample />);
