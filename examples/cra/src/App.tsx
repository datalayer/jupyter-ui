import {
  Jupyter,
  IpyWidgetsComponent,
  Notebook,
  CellSidebarDefault,
} from '@datalayer/jupyter-react';
import OutputsComponents from './examples/outputs/OutputsComponents';
import CellComponents from './examples/cell/CellComponents';
import IPyWidgetsSimple from './examples/ipywidgets/IPyWidgetsSimple';
import FileBrowserTree from './components/FileBrowserTree';

import './App.css';
function App() {
  return (
    <>
      <Jupyter startDefaultKernel={true}>
        <IpyWidgetsComponent Widget={IPyWidgetsSimple} />
        <OutputsComponents />
        <CellComponents />
        <Notebook path={'/ping.ipynb'} CellSidebar={CellSidebarDefault} />
        <FileBrowserTree />
      </Jupyter>
    </>
  );
}

export default App;
