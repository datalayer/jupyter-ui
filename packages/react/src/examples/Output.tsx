/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import Output from '../components/output/Output';

const SOURCE_1 = '1+1';

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

const OutputWithoutEditor = () => {
  return (
    <>
      <Text as="h1">Output without Editor</Text>
      <Output showEditor={false} outputs={OUTPUTS_1} />
    </>
  );
};

const OutputWithEditor = () => {
  const { defaultKernel } = useJupyter();
  return (
    <>
      <Text as="h1">Output with Editor</Text>
      <Output
        showEditor={true}
        autoRun={false}
        kernel={defaultKernel}
        code={SOURCE_1}
        outputs={OUTPUTS_1}
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
  </Jupyter>,
);
