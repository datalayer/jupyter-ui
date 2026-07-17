/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Session } from '@jupyterlab/services';
import { DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterUse';
import {
  CellSidebarExtension,
  CellSidebarButton,
  KernelIndicator,
  Notebook,
  NotebookToolbar,
} from '../components';
import { CellToolbarExtension } from './extensions';
import { OnSessionConnection } from '../state';
import { useExampleThemeSettings } from './themeStore';

import NBFORMAT from './notebooks/NotebookExample1.ipynb.json';

const NotebookLiteExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
  });
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();
  const [session, setSession] = useState<Session.ISessionConnection>();
  const extensions = useMemo(
    () => [
      new CellToolbarExtension(),
      new CellSidebarExtension({ factory: CellSidebarButton }),
    ],
    []
  );
  const onSessionConnection: OnSessionConnection = (
    session: Session.ISessionConnection | undefined
  ) => {
    console.log('Kernel Session.', session?.id, session?.kernel?.id);
    setSession(session);
  };
  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme colormode={resolvedMode} backgroundColor={backgroundColor}>
        {serviceManager && defaultKernel && (
          <>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                //              gap: '12px',
              }}
            >
              <KernelIndicator
                kernel={defaultKernel.connection}
                label="Kernel Connection Indicator"
              />
              <KernelIndicator
                kernel={session?.kernel}
                label="Kernel Session Indicator"
              />
            </div>
            <Notebook
              id="notebook2-nbformat-id"
              kernel={defaultKernel}
              serviceManager={serviceManager}
              nbformat={NBFORMAT as INotebookContent}
              height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
              extensions={extensions}
              Toolbar={NotebookToolbar}
              onSessionConnection={onSessionConnection}
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

root.render(<NotebookLiteExample />);
