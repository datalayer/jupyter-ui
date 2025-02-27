/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Heading, Textarea, Button } from '@primer/react';
import { useJupyter } from '../jupyter/JupyterContext';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import KernelProgressBar from './../components/kernel/KernelProgressBar';

export const KernelExecuteView = () => {
  const { defaultKernel: kernel } = useJupyter({ startDefaultKernel: true });
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string>();
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };
  const exec = () => {
    setRunning(true);
    setResult('');
    kernel?.execute(code)?.result
      .then((result: string) => {
        setResult(result);
      })
      .catch((error: string) => {
        console.log('Error', error);
        setResult(error);
      })
      .finally(() => {
        setRunning(false);  
      }
    );
  };
  const interrupt = () => {
    kernel?.interrupt();
  };
  return (
    <Box m={3}>
      <Heading>Wait on code execution</Heading>
      <Box>
        <Textarea
          placeholder="Enter some code, e.g. print('1+1'), and click on the Execute button."
          onChange={handleChange}
          value={code}
        />
        <Box mt={3} display="flex">
          <Box>
            <Button
              disabled={!kernel || running}
              onClick={exec}
              variant={!kernel || running ? 'default' : 'primary'}
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
          <Heading as="h3">Result</Heading>
          <Box>
            <pre>{result}</pre>
          </Box>
        </Box>
      )}
    </Box>
  );
}

const KernelExecute = () => {
  return (
    <JupyterReactTheme>
      <KernelExecuteView />
    </JupyterReactTheme>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecute />);
