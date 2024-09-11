/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutput } from '@jupyterlab/nbformat';
import { Button, Text } from '@primer/react';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Output } from '../components/output/Output';
import { useOutputsStore } from '../components/output/OutputState';
import { Jupyter } from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';

const SOURCE_ID = 'output-id-2';
const SOURCE = 'fail';


const OutputWithEditor = () => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  const [execTrigger, setExecTrigger] = useState(0);

  console.log(
    'Outputs',
    outputStore.getModel(SOURCE_ID)?.toJSON(),
    outputStore.getInput(SOURCE_ID),
  );

  const handleExecutionError = (err : any) => {
    alert('Execution error - ' + err);
  }

  return (
    <>
      <Text as="h1">Output with Error Handling</Text>
      <Button onClick={() => setExecTrigger(execTrigger => execTrigger+1)}>Execute 'fail' code</Button>
      <Output
        autoRun={false}
        code={SOURCE}
        id={SOURCE_ID} 
        kernel={defaultKernel}
        showEditor={false}
        executeTrigger={execTrigger}
        onCodeExecutionError={handleExecutionError}
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter>
    <OutputWithEditor />
  </Jupyter>
);
