/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import { Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { Output } from '../components/output/Output';
import { Jupyter } from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Kernel } from '../jupyter/kernel/Kernel';
import { useKernelsStore } from '../jupyter/kernel/KernelState';
import { newUuid } from '../utils/Utils';
import { useOutputsStore } from './../components/output/OutputState';

const SOURCE_ID_0 = 'output-id-0';
const CODE_O = `from ipywidgets import IntSlider
IntSlider(value=7, min=0, max=10, step=1,)
`;

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

const SOURCE_ID_1_1 = 'output-id-1-1';

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

const OutputIPyWidgetsExample = () => {
  const outputStore = useOutputsStore();
  console.log(
    'Outputs from Code IPyWidgets',
    outputStore.getModel(SOURCE_ID_0)?.toJSON(),
    outputStore.getInput(SOURCE_ID_0)
  );
  return (
    <>
      <Text as="h1">Output without Code Editor and IPyWidgets</Text>
      <Output autoRun id={SOURCE_ID_0} code={CODE_O} showEditor={false} />
    </>
  );
};

const OutputNoEditorNoAutorunExample = () => {
  const outputStore = useOutputsStore();
  console.log(
    'Outputs 1',
    outputStore.getModel(SOURCE_ID_1)?.toJSON(),
    outputStore.getInput(SOURCE_ID_1)
  );
  return (
    <>
      <Text as="h1">Output without Code Editor without Autorun</Text>
      <Output
        autoRun={false}
        id={SOURCE_ID_1}
        outputs={OUTPUTS_1}
        showEditor={false}
      />
    </>
  );
};

const OutputNoEditorExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  return (
    <>
      <Text as="h1">Output without Code Editor</Text>
      <Output
        autoRun
        code="1+1"
        id={SOURCE_ID_1_1}
        kernel={defaultKernel}
        showEditor={false}
      />
    </>
  );
};

const OutputNoEditorErrorExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  return (
    <>
      <Text as="h1">Output without Code Editor and Error</Text>
      <Output
        autoRun
        code="error"
        id={SOURCE_ID_1_1}
        kernel={defaultKernel}
        showEditor={false}
      />
    </>
  );
};

const OutputEditorExample = () => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  console.log(
    'Outputs 2',
    outputStore.getModel(SOURCE_ID_2)?.toJSON(),
    outputStore.getInput(SOURCE_ID_2)
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

const OutputEmptyExample = () => {
  const { kernelManager, serviceManager } = useJupyter();
  const outputStore = useOutputsStore();
  const kernelsStore = useKernelsStore();
  const [kernel, setKernel] = useState<Kernel>();
  useEffect(() => {
    if (serviceManager && kernelManager) {
      const kernel = new Kernel({
        path: newUuid(),
        kernelName: 'kernel-example',
        kernelSpecName: 'python',
        kernelManager,
        kernelspecsManager: serviceManager.kernelspecs,
        sessionManager: serviceManager.sessions,
      });
      setKernel(kernel);
    }
  }, [serviceManager, kernelManager]);
  console.log(
    'Outputs 3',
    outputStore.getModel(SOURCE_ID_3)?.toJSON(),
    outputStore.getInput(SOURCE_ID_3)
  );
  return (
    <>
      <Text as="h1">Output with empty Output</Text>
      {kernel && (
        <>
          <Box>Kernel State: {kernelsStore.getExecutionState(kernel.id)}</Box>
          <Box>Kernel Phase: {kernelsStore.getExecutionPhase(kernel.id)}</Box>
          <Box>
            <KernelIndicator kernel={kernel.connection} />
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
      )}
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter startDefaultKernel>
    <OutputIPyWidgetsExample />
    <OutputNoEditorNoAutorunExample />
    <OutputNoEditorExample />
    <OutputNoEditorErrorExample />
    <OutputEditorExample />
    <OutputEmptyExample />
  </Jupyter>
);
