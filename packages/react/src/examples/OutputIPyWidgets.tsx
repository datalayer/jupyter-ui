/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import OutputIPyWidgets from '../components/output/OutputIPyWidgets';

import { view, state } from './notebooks/OutputIPyWidgetsExample';

const OutputIPyWidgetsExample = () => {
  return (
    <JupyterReactTheme>
      <Text as="h1">Output IPyWidgets</Text>
      <OutputIPyWidgets view={view} state={state} />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);

const root = createRoot(div);
root.render(<OutputIPyWidgetsExample />);
