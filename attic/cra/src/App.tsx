/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Jupyter } from '@datalayer/jupyter-react';
import GalleryExample from './examples/GalleryExample';
import Layers from './layout/Layers';

import './App.css';

const App = () => {
  return (
    <>
      <Layers/>
      <Jupyter startDefaultKernel terminals>
        <GalleryExample/>
      </Jupyter>
    </>
  );
}

export default App;
