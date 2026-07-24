/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import OutputIPyWidgets from '../components/output/OutputIPyWidgets';

import { view, state } from './notebooks/OutputIPyWidgetsExample';

const OutputIPyWidgetsExample = () => {
  return (
    <ExampleJupyterReactTheme>
      <Text as="h1">Output IPyWidgets</Text>
      <OutputIPyWidgets view={view} state={state} />
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);

const root = createRoot(div);
root.render(<OutputIPyWidgetsExample />);
