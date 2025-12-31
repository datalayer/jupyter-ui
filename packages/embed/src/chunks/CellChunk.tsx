/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Cell Chunk - Contains all Cell-related dependencies
 * This chunk is loaded on-demand when a Cell component is needed
 */

import React from 'react';
import { JupyterReactTheme, Cell, useJupyter } from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from '../config';
import type { ICellEmbedOptions } from '../types';

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

interface ICellChunkProps {
  options: ICellEmbedOptions;
}

const CellInner: React.FC<ICellChunkProps> = ({ options }) => {
  const { defaultKernel } = useJupyterEmbed();

  return (
    <div style={{ height: options.height || '200px' }}>
      <Cell
        id={options.id}
        source={options.source || ''}
        type={options.cellType || 'code'}
        autoStart={options.autoExecute}
        showToolbar={options.showToolbar}
        kernel={defaultKernel}
      />
    </div>
  );
};

export const CellChunk: React.FC<ICellChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <CellInner options={options} />
    </JupyterReactTheme>
  );
};

export default CellChunk;
