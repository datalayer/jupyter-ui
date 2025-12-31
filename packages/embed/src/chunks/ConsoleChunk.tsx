/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Console Chunk - Contains all Console-related dependencies
 * This chunk is loaded on-demand when a Console component is needed
 */

import React from 'react';
import {
  JupyterReactTheme,
  Console,
  useJupyter,
} from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from '../config';
import type { IConsoleEmbedOptions } from '../types';

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

interface IConsoleChunkProps {
  options: IConsoleEmbedOptions;
}

const ConsoleInner: React.FC<IConsoleChunkProps> = ({ options }) => {
  useJupyterEmbed();

  return (
    <div style={{ height: options.height || '400px' }}>
      <Console code={options.initCode} />
    </div>
  );
};

export const ConsoleChunk: React.FC<IConsoleChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <ConsoleInner options={options} />
    </JupyterReactTheme>
  );
};

export default ConsoleChunk;
