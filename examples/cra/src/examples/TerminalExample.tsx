/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {render} from 'react-dom';
import {Jupyter, Terminal} from '@datalayer/jupyter-react';
import TerminalToolbar from './terminal/TerminalToolbar';
import Layers from '../layout/Layers';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel collaborative={false} terminals>
    <Layers />
    <TerminalToolbar />
    <Terminal height="500px" />
  </Jupyter>,
  div
);
