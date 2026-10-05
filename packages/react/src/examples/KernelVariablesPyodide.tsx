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

/** The variables of the in-browser Pyodide kernel, beside a notebook. */
const KernelVariablesPyodideExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    lite: true,
    startDefaultKernel: true,
  });
  const nbformat = useMemo(() => kernelVariablesNotebook(), []);
  return (
    <ExampleJupyterReactTheme>
      <KernelVariablesLayout
        title="Kernel Variables · Pyodide"
        description="Python runs in this page (Pyodide): run the cells, and the kernel's variables are listed beside them. numpy, pandas and matplotlib load on their first import."
        notebookId="kernel-variables-pyodide-notebook"
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

root.render(<KernelVariablesPyodideExample />);
