/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Output Chunk - Contains all Output-related dependencies
 * This chunk is loaded on-demand when an Output component is needed
 */

import React, { useEffect, useState } from 'react';
import {
  JupyterReactTheme,
  Output,
  useJupyter,
  Kernel,
} from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from '../config';
import type { IOutputEmbedOptions } from '../types';

/**
 * Hook to get Jupyter context from embed config
 */
const useJupyterEmbed = () => {
  const config = getJupyterEmbedConfig();
  return useJupyter({
    jupyterServerUrl: config.serverUrl || '',
    jupyterServerToken: config.token || '',
    startDefaultKernel: config.autoStartKernel,
    defaultKernelName: config.defaultKernel,
    terminals: true,
  });
};

interface IOutputChunkProps {
  options: IOutputEmbedOptions;
}

const OutputInner: React.FC<IOutputChunkProps> = ({ options }) => {
  const { defaultKernel } = useJupyterEmbed();
  const [kernelReady, setKernelReady] = useState(false);
  const [readyKernel, setReadyKernel] = useState<Kernel | undefined>(undefined);

  // Wait for kernel to be ready before rendering Output
  useEffect(() => {
    if (defaultKernel) {
      console.log(
        '[OutputChunk] Waiting for kernel to be ready...',
        defaultKernel,
      );
      defaultKernel.ready
        .then(() => {
          console.log('[OutputChunk] Kernel is ready!');
          setReadyKernel(defaultKernel);
          setKernelReady(true);
        })
        .catch((err: Error) => {
          console.error('[OutputChunk] Kernel ready failed:', err);
        });
    }
  }, [defaultKernel]);

  // Show loading state while kernel is not ready
  if (!kernelReady) {
    return (
      <div style={{ height: options.height || 'auto', padding: '10px' }}>
        <div>Waiting for kernel...</div>
      </div>
    );
  }

  return (
    <div style={{ height: options.height || 'auto' }}>
      <Output
        outputs={options.outputs || []}
        kernel={readyKernel}
        code={options.code}
        autoRun={options.autoRun}
        showEditor={false}
        lumino={true}
      />
    </div>
  );
};

export const OutputChunk: React.FC<IOutputChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <OutputInner options={options} />
    </JupyterReactTheme>
  );
};

export default OutputChunk;
