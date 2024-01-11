/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useState, useEffect } from 'react';
import { useJupyter } from './../../jupyter/JupyterContext';
import Lumino from '../lumino/Lumino';
import ConsoleAdapter from './ConsoleAdapter';

import './Console.css';

export const Console = () => {
  const { defaultKernel, defaultKernelIsLoading, serviceManager } = useJupyter();
  const [adapter, setAdapter] = useState<ConsoleAdapter>();
  useEffect(() => {
    if (serviceManager && !defaultKernelIsLoading) {
      const adapter = new ConsoleAdapter({
        kernel: defaultKernel,
        serviceManager,
      });
      setAdapter(adapter);
    }
  }, [defaultKernel, defaultKernelIsLoading, serviceManager]);
  return adapter ? (
    <Lumino>{adapter.panel}</Lumino>
  ) : (
    <>Loading Jupyter Console...</>
  );
};

export default Console;
