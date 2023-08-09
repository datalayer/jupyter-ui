"use client";

import Jupyter from '@datalayer/jupyter-react/lib/jupyter/Jupyter';
import Notebook from '@datalayer/jupyter-react/lib/components/notebook/Notebook';

export default function Home() {
  return (
    <>
      <h1>Jupyter React in Next.js</h1>
      <Jupyter
        jupyterServerHttpUrl="https://oss.datalayer.tech/api/jupyter"
        jupyterServerWsUrl="wss://oss.datalayer.tech/api/jupyter"
        jupyterToken="60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6"
      >
        <Notebook
          path="test.ipynb"
          uid="notebook-1"
        />
    </Jupyter>
  </>
  )
}
