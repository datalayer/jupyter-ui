'use client'

import { Jupyter, Notebook, CellSidebar } from '@datalayer/jupyter-react';

export const HomeComponent = () => {
  return (
    <>
      <div style={{fontSize: 20}}>Jupyter React in Next.js</div>
      <Jupyter
        jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
        jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
        jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      >
        <Notebook
          path="ipywidgets.ipynb"
          uid="notebook-nextjs-1"
          externalIPyWidgets={[
            { name: "@widgetti/jupyter-react", version: "0.3.0" },
            { name: "bqplot", version: "0.5.42" },
            { name: "jupyter-matplotlib", version: "0.11.3" },
          ]}
          cellSidebarMargin={120}
          CellSidebar={CellSidebar}
        />
    </Jupyter>
  </>
  )
}

export default HomeComponent;