/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { Jupyter, Notebook, CellSidebar } from '@datalayer/jupyter-react';
import { NotebookToolbar } from '@datalayer/jupyter-react';
import { Theme } from '@primer/react/lib/ThemeProvider';

type NotebookComponentProps = {
  colorMode: 'light' | 'dark';
  theme: Theme;
}

export const NotebookComponent = (props: NotebookComponentProps) => {
  const { colorMode, theme } = props;
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter Notebook in Next.js</div>
      <Jupyter
        jupyterServerUrl="https://oss.datalayer.run/api/jupyter-server"
        jupyterServerToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colormode={colorMode}
        theme={theme}
        startDefaultKernel
      >
        <Notebook
          path="ipywidgets.ipynb"
          id="notebook-nextjs-1"
          cellSidebarMargin={120}
          height="500px"
          CellSidebar={CellSidebar}
          Toolbar={NotebookToolbar}
        />
    </Jupyter>
  </>
  )
}

export default NotebookComponent;
