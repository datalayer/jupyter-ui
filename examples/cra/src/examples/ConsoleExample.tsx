/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {render} from 'react-dom';
import {Jupyter, Console} from '@datalayer/jupyter-react';
import Layers from './../layout/Layers';
import ConsoleToolbar from './console/ConsoleToolbar';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel collaborative={false} terminals={false}>
    <Layers />
    <ConsoleToolbar />
    <Console />
  </Jupyter>,
  div
);
