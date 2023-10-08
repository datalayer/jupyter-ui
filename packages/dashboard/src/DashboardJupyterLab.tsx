import { Jupyter, JupyterLabApp } from '@datalayer/jupyter-react';

import * as lightThemeExtension from '@jupyterlab/theme-light-extension';
import * as collaborationExtension from '@jupyter/collaboration-extension';
import * as dashboardExtension from './jupyterlab/index';

const JupyterLabComponent = () => (
  <JupyterLabApp
    extensions={[
      lightThemeExtension,
      collaborationExtension,
      dashboardExtension,
    ]}
    position="absolute"
    height="100vh"
  />
)

export const DashboardJupyterLab = () => (
  <Jupyter startDefaultKernel={false} disableCssLoading={true} collaborative={true}>
    <JupyterLabComponent/>
  </Jupyter>
)

export default DashboardJupyterLab;
