import { Jupyter } from '@datalayer/jupyter-react';
import GalleryExample from './examples/GalleryExample';

import './App.css';

const App = () => {
  return (
    <>
      <Jupyter startDefaultKernel={true} terminals={true}>
        <GalleryExample/>
      </Jupyter>
    </>
  );
}

export default App;
