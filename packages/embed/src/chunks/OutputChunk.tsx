/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Output Chunk - Contains all Output-related dependencies
 * This chunk is loaded on-demand when an Output component is needed
 */

import React, { useEffect } from 'react';
import {
  JupyterReactTheme,
  Output,
  useJupyter,
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

  return (
    <div style={{ height: options.height || 'auto' }}>
      <Output
        outputs={options.outputs || []}
        kernel={defaultKernel}
        code={options.code}
        autoRun={options.autoRun}
        showEditor={false}
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
