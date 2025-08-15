/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import reactLogo from './assets/react.svg';
import { useJupyter, JupyterReactTheme } from '@datalayer/jupyter-react';
import { CellExample } from './examples/CellExample';
import { NotebookExample } from './examples/NotebookExample';

// Fix for controls version failing to load in Vite.
// import * as controls from "@jupyter-widgets/controls/lib/index";
// const c = { ...controls }
// c.version = "0.1.0";

import './App.css';

function App() {
  const { defaultKernel, serviceManager } = useJupyter({
    jupyterServerUrl: 'https://oss.datalayer.run/api/jupyter-server',
    jupyterServerToken:
      '60c1661cc408f978c309d04157af55c9588ff9557c9380e4fb50785750703da6',
    startDefaultKernel: true,
  });
  const [count, setCount] = useState(0);
  return (
    <div className="App">
      <>
        <JupyterReactTheme>
          {defaultKernel && <CellExample kernel={defaultKernel} />}
          {defaultKernel && serviceManager && (
            <NotebookExample
              kernel={defaultKernel}
              serviceManager={serviceManager}
            />
          )}
        </JupyterReactTheme>
      </>
      <div>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>React + Vite</h1>
      <h2>On CodeSandbox!</h2>
      <div className="card">
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR.
        </p>
        <p>
          Tip: you can use the inspector button next to address bar to click on
          components in the preview and open the code in the editor!
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default App;
