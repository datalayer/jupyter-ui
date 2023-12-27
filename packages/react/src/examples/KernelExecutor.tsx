/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import Jupyter from '../jupyter/Jupyter';
import { useJupyter } from '../jupyter/JupyterContext';
import { Output } from '../components/output/Output';

const CODE = `from time import sleep
for i in range(0, 7):
      sleep(i)
      print("👉 " + str(i))

print("✨ Done!")
`

const KernelExecutorView = () => {
  const { defaultKernel } = useJupyter();
  const [outputAreaModel, setOutputAreaModel] = useState<IOutputAreaModel>();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (defaultKernel?.connection) {
      const kernelExecutor = defaultKernel.execute(CODE);
      kernelExecutor?.outputAreaModelChanged.connect((_, outputAreaModel) => {
        setOutputAreaModel(outputAreaModel);
      });
      kernelExecutor?.executed.then(() => {
        setDone(true);
      });
    }
  }, [defaultKernel?.connection]);
  return (
    <>
      { outputAreaModel &&
        <>
          <Output outputAreaModel={outputAreaModel} />
        </>
      }
      { done &&
        <>
          ✨✨ Done!
        </>
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
