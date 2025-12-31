/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Terminal Chunk - Contains all Terminal-related dependencies
 * This chunk includes xterm.js and JupyterLab terminal support
 */

import React from 'react';
import {
  JupyterReactTheme,
  Terminal,
  useJupyter,
} from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from '../config';
import type { ITerminalEmbedOptions } from '../types';

/**
 * Hook to initialize Jupyter with terminal support
 */
const useJupyterEmbed = () => {
  const config = getJupyterEmbedConfig();
  return useJupyter({
    jupyterServerUrl: config.serverUrl || '',
    jupyterServerToken: config.token || '',
    startDefaultKernel: false, // Terminals don't need a kernel
    terminals: true,
  });
};

interface ITerminalChunkProps {
  options: ITerminalEmbedOptions;
}

const TerminalInner: React.FC<ITerminalChunkProps> = ({ options }) => {
  // Just ensure Jupyter is initialized with terminal support
  useJupyterEmbed();

  return (
    <div style={{ height: options.height || '400px' }}>
      <Terminal colormode={options.colorMode || options.theme || 'light'} />
    </div>
  );
};

export const TerminalChunk: React.FC<ITerminalChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <TerminalInner options={options} />
    </JupyterReactTheme>
  );
};

export default TerminalChunk;
