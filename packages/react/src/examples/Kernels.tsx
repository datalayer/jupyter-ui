/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Box, Heading, Textarea, Button, Pagehead, Text } from '@primer/react';
import { IModel } from '@jupyterlab/services/lib/kernel/kernel';
import { ISpecModel } from '@jupyterlab/services/lib/kernelspec/kernelspec';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterContext';
import {
  KERNEL_STATES,
  KernelProgressBar,
  KernelIndicator,
  KernelActionMenu,
  KernelSelector,
  KernelUsage,
  KernelInspector,
  KernelLauncher,
  KernelVariables,
  KernelLogs,
  Kernels,
} from './../components/kernel';

export const KernelExecResultView = () => {
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
    const kernelExecutor = kernel?.execute(code);
    kernelExecutor?.result
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
      <Box>
        <Textarea
          placeholder="Enter some code, e.g. print('1+1')"
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
          <Heading>Result</Heading>
          <Box>
            <pre>{result}</pre>
          </Box>
        </Box>
      )}
    </Box>
  );
};

const KernelComponents = () => {
  const { kernel } = useJupyter();
  const selectKernel = (kernelModel: IModel) => {
    console.log('Jupyter Kernel model', kernelModel);
  };
  const selectKernelSpec = (specModel: ISpecModel) => {
    console.log('Jupyter Kernelspec model', specModel);
  };
  return (
    <>
      <Box display="flex">
        <Box>
          <KernelExecResultView />
        </Box>
        <Box>
          <Box display="flex" mt={3}>
            <Box>
              <Text
                as="p"
                sx={{
                  color: 'fg.onEmphasis',
                  bg: 'neutral.emphasis',
                  m: 0,
                  p: 2,
                }}
              >
                Kernel Status
              </Text>
            </Box>
            <Box ml={3}>
              <KernelIndicator kernel={kernel?.connection} />
            </Box>
            <Box ml={3}>
              {Array.from(KERNEL_STATES.entries()).map(entry => {
                return (
                  <Box display="flex">
                    <Box
                      style={{
                        verticalAlign: 'middle',
                        display: 'inline-flex',
                      }}
                    >
                      {entry[1]}
                    </Box>
                    <Box ml={3}>{entry[0]}</Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
          <Box display="flex" mt={3}>
            <Box>
              <Text
                as="p"
                sx={{
                  color: 'fg.onEmphasis',
                  bg: 'neutral.emphasis',
                  m: 0,
                  p: 2,
                }}
              >
                Kernel Action Menu
              </Text>
            </Box>
            <Box
              ml={3}
              style={{ verticalAlign: 'middle', display: 'inline-flex' }}
            >
              <KernelActionMenu kernel={kernel} />
            </Box>
          </Box>
          <Box display="flex" mt={3}>
            <Box>
              <Text
                as="p"
                sx={{
                  color: 'fg.onEmphasis',
                  bg: 'neutral.emphasis',
                  m: 0,
                  p: 2,
                }}
              >
                Kernel Selector
              </Text>
            </Box>
            <Box
              ml={3}
              style={{ verticalAlign: 'middle', display: 'inline-flex' }}
            >
              <KernelSelector
                selectKernel={selectKernel}
                selectKernelSpec={selectKernelSpec}
              />
            </Box>
          </Box>
          <Box display="flex" mt={3}>
            <Box>
              <Text
                as="p"
                sx={{
                  color: 'fg.onEmphasis',
                  bg: 'neutral.emphasis',
                  m: 0,
                  p: 2,
                }}
              >
                Kernel Launcher
              </Text>
            </Box>
            <Box
              ml={3}
              style={{ verticalAlign: 'middle', display: 'inline-flex' }}
            >
              <KernelLauncher />
            </Box>
          </Box>
          <Box display="flex" mt={3}>
            <Box>
              <Text
                as="p"
                sx={{
                  color: 'fg.onEmphasis',
                  bg: 'neutral.emphasis',
                  m: 0,
                  p: 2,
                }}
              >
                Kernel Logs
              </Text>
            </Box>
            <Box
              ml={3}
              style={{ verticalAlign: 'middle', display: 'inline-flex' }}
            >
              <KernelLogs />
            </Box>
          </Box>
        </Box>
      </Box>
      <Box mt={3}>
        <Box>
          <Text
            as="p"
            sx={{ color: 'fg.onEmphasis', bg: 'neutral.emphasis', m: 0, p: 2 }}
          >
            Kernel Usage
          </Text>
        </Box>
        <Box ml={3}>
          <KernelUsage kernel={kernel} />
        </Box>
      </Box>
      <Box mt={3}>
        <Box>
          <Text
            as="p"
            sx={{ color: 'fg.onEmphasis', bg: 'neutral.emphasis', m: 0, p: 2 }}
          >
            Kernel Variables
          </Text>
        </Box>
        <Box ml={3}>
          <KernelVariables kernel={kernel} />
        </Box>
      </Box>
      <Box mt={3}>
        <Box>
          <Text
            as="p"
            sx={{ color: 'fg.onEmphasis', bg: 'neutral.emphasis', m: 0, p: 2 }}
          >
            Kernels
          </Text>
        </Box>
        <Box ml={3}>
          <Kernels />
        </Box>
      </Box>
      <Box mt={3}>
        <Box>
          <Text
            as="p"
            sx={{ color: 'fg.onEmphasis', bg: 'neutral.emphasis', m: 0, p: 2 }}
          >
            Kernel Inspector
          </Text>
        </Box>
        <Box>
          <KernelInspector kernel={kernel} />
        </Box>
      </Box>
    </>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <JupyterReactTheme>
    <Pagehead>The Kernel Components</Pagehead>
    <KernelComponents />
  </JupyterReactTheme>
);
