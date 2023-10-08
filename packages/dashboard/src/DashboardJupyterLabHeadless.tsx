import { useState } from 'react';
import { createGlobalStyle } from 'styled-components';
import { Jupyter, JupyterLabApp, JupyterLabAppAdapter } from '@datalayer/jupyter-react';
import Dashboard from './Dashboard';

import * as lightThemeExtension from '@jupyterlab/theme-light-extension';
import * as collaborationExtension from '@jupyter/collaboration-extension';
import * as dashboardExtension from './jupyterlab/index';

const ThemeGlobalStyle = createGlobalStyle<any>`
  body {
    background-color: white !important;
  }
`

const JupyterLabHeadless = () => {
  const [jupyterLabAppAdapter, setJupyterLabAppAdapter] = useState<JupyterLabAppAdapter>();
  const onJupyterLab = (jupyterLabAppAdapter: JupyterLabAppAdapter) => {
    setJupyterLabAppAdapter(jupyterLabAppAdapter);
  }
  return (
    <>
      {jupyterLabAppAdapter && <Dashboard/>}
      <JupyterLabApp
        extensions={[
          lightThemeExtension,
          collaborationExtension,
          dashboardExtension,
        ]}
        headless={true}
        onJupyterLab={onJupyterLab}
      />
    </>
  )
}

export const DashboardJupyterLabHeadless = () => (
  <Jupyter startDefaultKernel={false} disableCssLoading={true} collaborative={true}>
    <ThemeGlobalStyle />
    <JupyterLabHeadless/>
  </Jupyter>
)

export default DashboardJupyterLabHeadless;
