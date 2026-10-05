/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { useMemo } from 'react';
import { useJupyter } from '../jupyter/JupyterUse';
import { ExampleJupyterReactTheme } from './ExampleJupyterReactTheme';
import {
  KernelVariablesLayout,
  kernelVariablesNotebook,
} from './kernel-variables/KernelVariablesLayout';

/** The variables of a Jupyter server kernel (ipykernel), beside a notebook. */
const KernelVariablesExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const nbformat = useMemo(() => kernelVariablesNotebook(), []);
  return (
    <ExampleJupyterReactTheme>
      <KernelVariablesLayout
        title="Kernel Variables"
        description="Run the cells: the variables of the Jupyter server kernel are listed beside them, after each run. Click one to see it drawn by its renderer."
        notebookId="kernel-variables-notebook"
        nbformat={nbformat}
        kernel={defaultKernel}
        serviceManager={serviceManager}
      />
    </ExampleJupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<KernelVariablesExample />);
