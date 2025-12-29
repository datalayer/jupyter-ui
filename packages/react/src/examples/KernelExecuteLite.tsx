/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Heading, Textarea, Button } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter/JupyterUse';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { KernelProgressBar } from '../components/kernel/KernelProgressBar';

export const KernelExecuteLiteExample = () => {
  const { defaultKernel } = useJupyter({
    startDefaultKernel: true,
    lite: true,
  });
  const [running, setRunning] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<string>();
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(event.target.value);
  };
  const exec = () => {
    setRunning(true);
    setResult('');
    defaultKernel
      ?.execute(code)
      ?.result.then((result: string) => {
        setResult(result);
      })
      .catch((error: string) => {
        console.log('Error', error);
        setResult(error);
      })
      .finally(() => {
        setRunning(false);
      });
  };
  const interrupt = () => {
    defaultKernel?.interrupt();
  };
  return (
    <JupyterReactTheme>
      <Box m={3}>
        <Heading>Kernel Execute Lite</Heading>
        <Box>
          <KernelIndicator
            kernel={defaultKernel?.connection}
            label="Kernel Indicator"
          />
        </Box>
        <Box>
          <Textarea
            placeholder="Enter some code, e.g. print('1+1'), and click on the Execute button."
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
            <Heading as="h3">Result</Heading>
            <Box>
              <pre>{result}</pre>
            </Box>
          </Box>
        )}
      </Box>
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecuteLiteExample />);
