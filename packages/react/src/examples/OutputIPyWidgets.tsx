/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { render } from 'react-dom';
import { Text } from '@primer/react';
import { JupyterReactTheme } from '../themes/JupyterReactTheme';
import OutputIPyWidgets from '../components/output/OutputIPyWidgets';

import { view, state } from './notebooks/OutputIPyWidgetsExample';

const OutputIPyWidgetsExample = () => {
  return (
    <>
      <Text as="h1">Output IPyWidgets</Text>
      <OutputIPyWidgets view={view} state={state} />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <JupyterReactTheme>
    <OutputIPyWidgetsExample />
  </JupyterReactTheme>,
  div
);
