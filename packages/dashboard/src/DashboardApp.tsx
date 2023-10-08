/// <reference types="webpack-env" />

import { createRoot } from 'react-dom/client';
import DashboardJupyterLabHeadless from './DashboardJupyterLabHeadless';

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

if (module.hot) {
  module.hot.accept('./DashboardJupyterLabHeadless', () => {
    const DashboardJupyterLabHeadless = require('./DashboardJupyterLabHeadless').default;
    root.render(<DashboardJupyterLabHeadless/>);
  })
}

root.render(<DashboardJupyterLabHeadless />);
