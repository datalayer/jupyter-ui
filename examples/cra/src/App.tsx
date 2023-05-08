import {
  Jupyter,
  Notebook,
//  CellSidebarDefault,
} from '@datalayer/jupyter-react';
import CellSidebarComponent from './examples/notebook/CellSidebarComponent';
// import Gallery from './examples/gallery/Gallery';

import './App.css';

const App = () => {
  return (
    <>
      <Jupyter startDefaultKernel={true} terminals={true}>
        <Notebook path={'/ping.ipynb'} CellSidebar={CellSidebarComponent} />
      </Jupyter>
    </>
  );
}

export default App;
