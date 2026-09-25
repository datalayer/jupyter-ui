/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A Marimo notebook: `variant="marimo"` makes the notebook reactive.
 *
 * Running a cell registers every code cell's source in Marimo's dataflow
 * graph, kept in the kernel, then runs the cells that depend on what the cell
 * defined, in dependency order. Change `price` in the first cell and run it:
 * `total`, `tax` and the summary run again; the last cell, which reads
 * nothing, does not.
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

import NBFORMAT from './notebooks/MarimoExample.ipynb.json';

const MarimoNotebookExample = () => {
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
                label="Marimo notebook"
                variant="marimo"
              />
            </Box>
            <Notebook
              nbformat={NBFORMAT as INotebookContent}
              id="notebook-marimo-id"
              kernel={defaultKernel}
              serviceManager={serviceManager}
              height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
              extensions={extensions}
              variant="marimo"
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

root.render(<MarimoNotebookExample />);
