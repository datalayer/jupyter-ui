/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { type INotebookContent } from '@jupyterlab/nbformat';
import {
  AppearanceControlsWithStore,
  Box,
  createThemeStore,
  DatalayerThemeProvider,
  themeConfigs,
  useSystemColorMode,
} from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { CellSidebarExtension, Notebook, NotebookToolbar } from '../components';
import { JupyterReactTheme } from '../theme';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const useNotebookPrimerThemeStore = createThemeStore(
  'jupyter-react-notebook-primer-theme-example',
  {
    colorMode: 'auto',
    theme: 'matrix',
  }
);

const NotebookPrimerThemeExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });

  const { colorMode, theme: themeVariant } = useNotebookPrimerThemeStore();
  const systemMode = useSystemColorMode();
  const resolvedMode = colorMode === 'auto' ? systemMode : colorMode;
  const themeConfig = themeConfigs[themeVariant];
  const modeStyles =
    resolvedMode === 'dark'
      ? themeConfig.themeStyles.dark
      : themeConfig.themeStyles.light;
  const themeBackground =
    (modeStyles as Record<string, string>).backgroundColor ?? '';

  const extensions = useMemo(() => [new CellSidebarExtension()], []);

  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AppearanceControlsWithStore useStore={useNotebookPrimerThemeStore} />
        <JupyterReactTheme
          colormode={resolvedMode}
          backgroundColor={themeBackground}
        >
          {serviceManager && defaultKernel && (
            <Notebook
              id="notebook-primer-theme-example-id"
              kernel={defaultKernel}
              serviceManager={serviceManager}
              nbformat={NBFORMAT as INotebookContent}
              height="calc(100vh - 13rem)"
              extensions={extensions}
              Toolbar={NotebookToolbar}
              startDefaultKernel
            />
          )}
        </JupyterReactTheme>
      </Box>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookPrimerThemeExample />);
