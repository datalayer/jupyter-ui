/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { Heading, Text } from '@primer/react';
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
        useBaseStyles={false}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            px: 3,
            py: 2,
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Heading as="h2" sx={{ mb: 1 }}>
              Notebook
            </Heading>
            <Text as="p" sx={{ m: 0, color: 'fg.muted' }}>
              Jupyter notebook example in lexical.
            </Text>
            <Box sx={{ mt: 2 }}>
              <KernelIndicator
                kernel={defaultKernel?.connection}
                label="Kernel"
                bordered={false}
                position="bottom-right"
              />
            </Box>
          </Box>
        </Box>
        {serviceManager && defaultKernel && (
          <>
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
