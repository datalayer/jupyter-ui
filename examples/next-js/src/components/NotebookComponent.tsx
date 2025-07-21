/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { useJupyter, JupyterReactTheme, Notebook2, NotebookToolbar, CellSidebarExtension, CellSidebarButton } from '@datalayer/jupyter-react';
import { Box } from '@primer/react';
import { PrimerTheme } from './PrimerTheme';
import { useMemo } from 'react';

type INotebookComponentProps = {
  colorMode?: 'light' | 'dark';
  theme?: PrimerTheme;
}

export const NotebookComponent = (props: INotebookComponentProps) => {
//  const { colorMode, theme } = props;
  const { defaultKernel, serviceManager } = useJupyter({
    jupyterServerUrl: "https://oss.datalayer.run/api/jupyter-server",
    jupyterServerToken: "60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6",
    startDefaultKernel: true,
  });
  const extensions = useMemo(() => [
    new CellSidebarExtension({ factory: CellSidebarButton })
  ], []);
  return (
    <>
     { defaultKernel && serviceManager ?
      <>
        <div style={{fontSize: 20}}>Jupyter Notebook in Next.js</div>
        <JupyterReactTheme>
          <Box
            sx={{
              '& .jp-NotebookPanel': {
                height: '500px !important',
                maxHeight: '500px !important',
                width: '100%',
                overflowY: 'hidden',
              },
              '& .jp-Notebook': {
                flex: '1 1 auto !important',
                height: '500px !important',
                maxHeight: '500px !important',
                overflowY: 'scroll',
              },
            }}
          >
            <Notebook2
              path="ipywidgets.ipynb"
              id="notebook-nextjs-1"
              cellSidebarMargin={120}
              height="500px"
              kernelId={defaultKernel.id}
              serviceManager={serviceManager}
              extensions={extensions}
              Toolbar={NotebookToolbar}
            />
          </Box>
        </JupyterReactTheme>
      </>
    :
      <p>Loading Jupyter Notebook...</p>
    }
  </>
  )
}

NotebookComponent.defaultProps = {
  colorMode: 'light' as 'light' | 'dark',
  theme: undefined,
};

export default NotebookComponent;
