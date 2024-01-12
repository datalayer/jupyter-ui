/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Heading, Textarea, Button } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import KernelProgressBar from './../components/kernel/KernelProgressBar';

export const KernelExecResultView = () => {
  const { defaultKernel } = useJupyter();
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string>();
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };
  const exec = async () => {
    setRunning(true);
    setResult('');
    const result = await defaultKernel?.execute(code)?.result;
    setResult(result);
    setRunning(false);
  };
  const interrupt = () => {
    defaultKernel?.interrupt();
  };
  return (
    <Box m={3}>
      <Heading>Wait on Code execution with a Promise</Heading>
      <Box>
        <Textarea
          placeholder="Enter some code, e.g. print('1+1')"
          onChange={handleChange}
          value={code}
        />
        <Box mt={3} display="flex">
          <Box>
            <Button
              disabled={!defaultKernel || running}
              onClick={exec}
              variant={!defaultKernel || running ? 'default' : 'primary'}
            >
              Execute
            </Button>
          </Box>
          <Box ml={3}>
            <Button disabled={!running} onClick={interrupt} variant="danger">
              Interrupt
            </Button>
          </Box>
        </Box>
      </Box>
      {running && (
        <Box mt={3}>
          <KernelProgressBar />
        </Box>
      )}
      {result && (
        <Box mt={3}>
          <Heading>Promise Result</Heading>
          <Box>
            <pre>{result}</pre>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const KernelExecResult = () => {
  return (
    <Jupyter>
      <KernelExecResultView />
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecResult />);
