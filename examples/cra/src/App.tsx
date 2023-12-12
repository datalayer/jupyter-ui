/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
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
      <Jupyter startDefaultKernel={true} terminals={true}>
        <GalleryExample/>
      </Jupyter>
    </>
  );
}

export default App;
