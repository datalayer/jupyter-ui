/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { render } from 'react-dom';
import { Jupyter, OutputIPyWidgets } from '@datalayer/jupyter-react';
import { state, view } from './IPyWidgetsSimple';
import IPyWidgetsToolbar from './IPyWidgetsToolbar';
import Layers from '../../layout/Layers';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel collaborative={false} terminals={false}>
    <Layers />
    <IPyWidgetsToolbar />
    <OutputIPyWidgets state={state} view={view} />
  </Jupyter>,
  div
);
