/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Box, Heading } from '@primer/react';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { KernelMessage } from '@jupyterlab/services';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Output } from '../components/output/Output';
import {
  IOPubMessageHook,
  ShellMessageHook,
} from '../jupyter/kernel/KernelExecutor';

const CODE = `from time import sleep
for i in range(0, 3):
      sleep(1)
      print("👉 " + str(i))

print("🔁 I am done with looping!")`;

const KernelExecutorView = () => {
  const { defaultKernel } = useJupyter();
  const [outputAreaModel, setOutputAreaModel] = useState<IOutputAreaModel>();
  const [finalOutputAreaModel, setFinalOutputAreaModel] =
    useState<IOutputAreaModel>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (defaultKernel?.connection) {
      const iopubMessageHook: IOPubMessageHook = (
        msg: KernelMessage.IIOPubMessage
      ) => {
        // Do something with the IOPub message.
        console.log('---iopubMessage', msg);
        return true;
      };
      const shellMessageHook: ShellMessageHook = (
        msg: KernelMessage.IShellControlMessage
      ) => {
        // Do something with the IOPub message.
        console.log('---shellMessage', msg);
        return true;
      };
      const kernelExecutor = defaultKernel.execute(
        CODE,
        [iopubMessageHook],
        [shellMessageHook]
      );
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
      {outputAreaModel && (
        <Box>
          <Heading>Streaming Output</Heading>
          <Output model={outputAreaModel} />
        </Box>
      )}
      {done && (
        <Box>
          <Heading>Done ✨</Heading>
        </Box>
      )}
      {finalOutputAreaModel && (
        <Box>
          <Heading>Final Output</Heading>
          <Output model={finalOutputAreaModel} showControl={false} />
        </Box>
      )}
    </>
  );
};

const KernelExecutor = () => {
  return (
    <Jupyter>
      <KernelExecutorView />
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecutor />);
