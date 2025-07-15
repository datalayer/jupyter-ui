/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import Layers from './../layout/Layers';
import CellComponents from './cell/CellComponents';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel collaborative={false} terminals={false}>
    <Layers />
    <CellComponents />
  </Jupyter>,
  div
);
