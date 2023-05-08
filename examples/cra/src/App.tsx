import {
  Jupyter,
  Notebook,
} from '@datalayer/jupyter-react';
import Gallery from './examples/gallery/Gallery';

import './App.css';

const App = () => {
  return (
    <>
      <Jupyter startDefaultKernel={true} terminals={true}>
        <Gallery/>
      </Jupyter>
    </>
  );
}

export default App;
