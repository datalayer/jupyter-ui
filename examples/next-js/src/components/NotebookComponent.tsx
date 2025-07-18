/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import { JupyterReactTheme, Notebook, CellSidebarExtension, CellSidebarButton } from '@datalayer/jupyter-react';
import { NotebookToolbar } from '@datalayer/jupyter-react';
import { PrimerTheme } from './PrimerTheme';

type NotebookComponentProps = {
  colorMode?: 'light' | 'dark';
  theme?: PrimerTheme;
}

export const NotebookComponent = (props: NotebookComponentProps) => {
  const { colorMode, theme } = props;
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter Notebook in Next.js</div>
      <JupyterReactTheme>
        <Notebook
          path="ipywidgets.ipynb"
          id="notebook-nextjs-1"
          cellSidebarMargin={120}
          height="500px"
          extensions={[new CellSidebarExtension({ factory: CellSidebarButton })]}
          Toolbar={NotebookToolbar}
        />
    </JupyterReactTheme>
  </>
  )
}

NotebookComponent.defaultProps = {
  colorMode: 'light' as 'light' | 'dark',
  theme: undefined,
};

export default NotebookComponent;
