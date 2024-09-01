/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IOutput } from '@jupyterlab/nbformat';
import { Box, Text } from '@primer/react';
import { useOutputsStore } from './../components/output/OutputState';
import { useJupyter } from '../jupyter/JupyterContext';
import { Jupyter } from '../jupyter/Jupyter';
import { Kernel } from '../jupyter/kernel/Kernel';
import { useKernelsStore } from '../jupyter/kernel/KernelState';
import { KernelIndicator } from '../components/kernel/Kernelndicator';
import { newUuid } from '../utils/Utils';
import { Output } from '../components/output/Output';

const SOURCE_ID_1 = 'output-id-1';
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

const SOURCE_ID_2 = 'output-id-2';
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

const SOURCE_ID_3 = 'output-id-3';
const SOURCE_3 = 'x=2';
const OUTPUTS_3: IOutput[] = [
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
  const outputStore = useOutputsStore();
  console.log(
    'Outputs 1',
    outputStore.getModel(SOURCE_ID_1)?.toJSON(),
    outputStore.getInput(SOURCE_ID_1),
  );
  return (
    <>
      <Text as="h1">Output without Code Editor</Text>
      <Output
        autoRun={false}
        id={SOURCE_ID_1}
        outputs={OUTPUTS_1}
        showEditor={false}
      />
    </>
  );
};

const OutputWithEditor = () => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  console.log(
    'Outputs 2',
    outputStore.getModel(SOURCE_ID_2)?.toJSON(),
    outputStore.getInput(SOURCE_ID_2),
  );
  return (
    <>
      <Text as="h1">Output with Code Editor</Text>
      <Output
        autoRun={false}
        code={SOURCE_2}
        id={SOURCE_ID_2} 
        kernel={defaultKernel}
        outputs={OUTPUTS_2}
        showEditor
      />
    </>
  );
};

const OutputWithEmptyOutput = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const outputStore = useOutputsStore();
  const kernelsStore = useKernelsStore();
  const [kernel, setKernel] = useState<Kernel>();
  useEffect( () => {
    if (serviceManager && kernelManager) {
      const kernel = new Kernel({
        kernelManager,
        kernelName: 'kernel-example',
        kernelSpecName: 'python',
        kernelspecsManager: serviceManager.kernelspecs,
        path: newUuid(),
        sessionManager: serviceManager.sessions,
      });
      setKernel(kernel);
    }
  }, [serviceManager, kernelManager]);
  console.log(
    'Outputs 3',
    outputStore.getModel(SOURCE_ID_3)?.toJSON(),
    outputStore.getInput(SOURCE_ID_3),
  );
  return (
    <>
      <Text as="h1">Output with empty Output</Text>
      { kernel &&
        <>
          <Box>
            Kernel State: {kernelsStore.getExecutionState(kernel.id)}
          </Box>
          <Box>
            Kernel Phase: {kernelsStore.getExecutionPhase(kernel.id)}
          </Box>
          <Box>
            <KernelIndicator kernel={kernel.connection}/>
          </Box>
          <Box>
            <Output
              autoRun={false}
              code={SOURCE_3}
              id={SOURCE_ID_3}
              kernel={kernel}
              outputs={OUTPUTS_3}
              showEditor
            />
          </Box>
        </>
      }
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
    <OutputWithEmptyOutput />
  </Jupyter>
);
