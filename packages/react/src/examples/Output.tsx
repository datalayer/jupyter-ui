/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import { useJupyterStore } from './../state';
import { useJupyter } from '../jupyter/JupyterContext';
import Jupyter from '../jupyter/Jupyter';
import Output from '../components/output/Output';

const SOURCE_ID_1 = '1';
const OUTPUTS_1: IOutput[] = [
  {
    data: {
      'text/plain': ['2'],
    },
    execution_count: 1,
    metadata: {},
    output_type: 'execute_result',
  },
];

const SOURCE_ID_2 = '2';
const SOURCE_2 = '2+2';
const OUTPUTS_2: IOutput[] = [
  {
    data: {
      'text/plain': ['4'],
    },
    execution_count: 1,
    metadata: {},
    output_type: 'execute_result',
  },
];

const OutputWithoutEditor = () => {
  const outputStore = useJupyterStore().outputStore();
  console.log(
    'Outputs 1',
    outputStore.getAdapter(SOURCE_ID_1)?.outputArea.model.toJSON(),
    outputStore.getSource(SOURCE_ID_1),
  );
  return (
    <>
      <Text as="h1">Output without Code Editor</Text>
      <Output
        showEditor={false}
        sourceId={SOURCE_ID_1}
        outputs={OUTPUTS_1}
      />
    </>
  );
};

const OutputWithEditor = () => {
  const { defaultKernel } = useJupyter();
  const outputStore = useJupyterStore().outputStore();
  console.log(
    'Outputs 2',
    outputStore.getAdapter(SOURCE_ID_2)?.outputArea.model.toJSON(),
    outputStore.getSource(SOURCE_ID_2),
  );
  return (
    <>
      <Text as="h1">Output with Code Editor</Text>
      <Output
        showEditor={true}
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_2}
        sourceId={SOURCE_ID_2} 
        outputs={OUTPUTS_2}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter>
    <OutputWithoutEditor />
    <OutputWithEditor />
  </Jupyter>
);
