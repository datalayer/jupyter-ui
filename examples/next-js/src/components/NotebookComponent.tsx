/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

'use client'

import {Jupyter, Notebook, CellSidebar} from "../../../../packages/react"
// import {NotebookToolbarAutoSave} from '../../../../packages/react/src/examples/toolbars/NotebookToolbarAutoSave'

type NotebookComponentProps = {
  colorMode: 'light' | 'dark';
}

export const NotebookComponent = (props: NotebookComponentProps) => {
  const { colorMode } = props;
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter Notebook in Next.js</div>
      <Jupyter
        jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
        jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
        jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
        colorMode={colorMode}
      >
        <Notebook
          path="ipywidgets.ipynb"
          uid="notebook-nextjs-1"
          cellSidebarMargin={120}
          // CellSidebar={CellSidebar}
          // Toolbar={NotebookToolbarAutoSave}
        />
    </Jupyter>
  </>
  )
}

export default NotebookComponent;
