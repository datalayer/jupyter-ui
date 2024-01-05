/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Heading } from '@primer/react';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Output } from '../components/output/Output';

const CODE = `from time import sleep
for i in range(0, 4):
      sleep(i)
      print("👉 " + str(i))

print("Loop is finished!")
`

const KernelExecutorView = () => {
  const { defaultKernel } = useJupyter();
  const [outputAreaModel, setOutputAreaModel] = useState<IOutputAreaModel>();
  const [finalOutputAreaModel, setFinalOutputAreaModel] = useState<IOutputAreaModel>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (defaultKernel?.connection) {
      const kernelExecutor = defaultKernel.execute(CODE);
      kernelExecutor?.modelChanged.connect((_, outputAreaModel) => {
        setOutputAreaModel(outputAreaModel);
      });
      kernelExecutor?.executed.then(() => {
        setDone(true);
        setFinalOutputAreaModel(kernelExecutor.model);
      });
    }
  }, [defaultKernel?.connection]);
  return (
    <>
      { outputAreaModel &&
        <Box>
          <Heading>Streaming Output</Heading>
          <Output model={outputAreaModel} />
        </Box>
      }
      { done &&
        <Box>
          <Heading>Done ✨</Heading>
        </Box>
      }
      { finalOutputAreaModel &&
        <Box>
          <Heading>Final Output</Heading>
          <Output model={finalOutputAreaModel} showControl={false} />
        </Box>
      }
    </>
  );
}

const KernelExecutor = () => {
  return (
    <Jupyter>
      <KernelExecutorView />
    </Jupyter>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecutor />);
