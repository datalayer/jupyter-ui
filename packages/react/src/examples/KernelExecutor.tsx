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
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { useJupyter } from '../jupyter/JupyterContext';
import { Output } from '../components/output/Output';
import { IOPubMessageHook, ShellMessageHook } from '../jupyter/kernel/KernelExecutor';

const CODE = `from time import sleep
for i in range(0, 15):
      sleep(1)
      print("👉 " + str(i))

print("🔁 I am done with looping!")`;

const KernelExecutorView = () => {
  const { defaultKernel } = useJupyter( { startDefaultKernel: true });
  const [outputAreaModel, setOutputAreaModel] = useState<IOutputAreaModel>();
  const [finalOutputAreaModel, setFinalOutputAreaModel] = useState<IOutputAreaModel>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (defaultKernel?.connection) {
      const iopubMessageHook: IOPubMessageHook = (
        msg: KernelMessage.IIOPubMessage
      ) => {
        // Do something with the IOPub message.
        console.log('Jupyter Kernel iopub message', msg);
        return true;
      };
      const shellMessageHook: ShellMessageHook = (
        msg: KernelMessage.IShellControlMessage
      ) => {
        // Do something with the Shell message.
        console.log('Jupyter Kernel shell message', msg);
        return true;
      };
      const kernelExecutor = defaultKernel.execute(CODE, {
        iopubMessageHooks: [iopubMessageHook],
        shellMessageHooks: [shellMessageHook],
      });
      kernelExecutor?.modelChanged.connect((_, outputAreaModel) => {
        setOutputAreaModel(outputAreaModel);
      });
      kernelExecutor?.done.then(() => {
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
    <JupyterReactTheme>
      <KernelExecutorView />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelExecutor />);
