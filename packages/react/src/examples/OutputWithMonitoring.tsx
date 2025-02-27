/* eslint-disable no-case-declarations */
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
import { IExecutionPhaseOutput } from '../jupyter/kernel';
import { ExecutionPhase } from '../jupyter/kernel/KernelState';

const SOURCE_ID_1 = 'output-id-1';
const SOURCE_1 = 'fail';

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
const SOURCE_3 = 'a = 5';

const SOURCE_ID_4 = 'output-id-4';
const SOURCE_4 =
  "import warnings; warnings.warn('This is a warning message'); print('See warning in output!')";

const SOURCE_ID_5 = 'output-id-5';
const SOURCE_5 = 'print(2+2)';

const OutputWithMonitoring = ({
  title,
  id,
  code,
  output,
}: {
  title: string;
  id: string;
  code: string;
  output?: IOutput[];
}) => {
  const { defaultKernel } = useJupyter();
  const outputStore = useOutputsStore();
  const [execTrigger, setExecTrigger] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  console.log(
    'Outputs',
    outputStore.getModel(id)?.toJSON(),
    outputStore.getInput(id)
  );

  const handleExecutionPhaseChanged = (phaseOutput: IExecutionPhaseOutput) => {
    switch (phaseOutput.executionPhase) {
      case ExecutionPhase.running:
        const log = [new Date().toISOString() + ' EXECUTION PHASE - RUNNING'];
        setExecutionLog(log);
        break;
      case ExecutionPhase.completed:
        setExecutionLog(executionLog => [
          ...executionLog,
          new Date().toISOString() +
            ' EXECUTION PHASE - COMPLETED and output ' +
            JSON.stringify(phaseOutput.outputModel?.toJSON()),
        ]);
        break;
      case ExecutionPhase.completed_with_error:
        setExecutionLog(executionLog => [
          ...executionLog,
          new Date().toISOString() +
            ' EXECUTION PHASE - COMPLETED_WITH_ERROR and output ' +
            JSON.stringify(phaseOutput.outputModel?.toJSON()),
        ]);
        break;
      case ExecutionPhase.completed_with_warning:
        setExecutionLog(executionLog => [
          ...executionLog,
          new Date().toISOString() +
            ' EXECUTION PHASE - COMPLETED_WITH_WARNING and output ' +
            JSON.stringify(phaseOutput.outputModel?.toJSON()),
        ]);
        break;
    }
  };

  return (
    <>
      <Text as="h1">{title}</Text>
      <Button onClick={() => setExecTrigger(execTrigger => execTrigger + 1)}>
        Execute with monitoring
      </Button>
      <div
        style={{
          padding: '10px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <span style={{ fontWeight: '600' }}>Execution log</span>
        <div>
          {executionLog.map((logEntry, index) => {
            return (
              <p key={index} style={{ textAlign: 'left' }}>
                {logEntry}
              </p>
            );
          })}
        </div>
      </div>

      <Output
        autoRun={false}
        code={code}
        id={id}
        kernel={defaultKernel}
        executeTrigger={execTrigger}
        outputs={output ? output : []}
        onExecutionPhaseChanged={handleExecutionPhaseChanged}
        suppressCodeExecutionErrors={true}
        showEditor
      />
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <Jupyter startDefaultKernel>
    <OutputWithMonitoring
      title="Output with error code"
      key="1"
      id={SOURCE_ID_1}
      code={SOURCE_1}
    />

    <OutputWithMonitoring
      title="Output with correct code"
      key="2"
      id={SOURCE_ID_2}
      code={SOURCE_2}
      output={OUTPUTS_2}
    />

    <OutputWithMonitoring
      title="Code with no output"
      key="3"
      id={SOURCE_ID_3}
      code={SOURCE_3}
    />

    <OutputWithMonitoring
      title="Code generating warning"
      key="4"
      id={SOURCE_ID_4}
      code={SOURCE_4}
    />

    <OutputWithMonitoring
      title="Code with stream output"
      key="5"
      id={SOURCE_ID_5}
      code={SOURCE_5}
    />
  </Jupyter>
);
