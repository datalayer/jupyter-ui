/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Notebook Chunk - Contains all Notebook-related dependencies
 * This chunk is loaded on-demand when a Notebook component is needed
 */

import React from 'react';
import {
  JupyterReactTheme,
  Notebook,
  useJupyter,
} from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from '../config';
import type { INotebookEmbedOptions } from '../types';

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

interface INotebookChunkProps {
  options: INotebookEmbedOptions;
}

const NotebookInner: React.FC<INotebookChunkProps> = ({ options }) => {
  const { serviceManager, defaultKernel } = useJupyterEmbed();
  const nbformat =
    typeof options.content === 'object' ? options.content : undefined;
  const height = options.height || '500px';

  if (!serviceManager) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height,
        color: '#656d76',
      }}>
        Connecting to Jupyter server...
      </div>
    );
  }

  return (
    <div style={{ height }}>
      <Notebook
        id={options.id || 'embedded-notebook'}
        path={options.path}
        nbformat={nbformat as any}
        readonly={options.readonly}
        serviceManager={serviceManager}
        kernel={defaultKernel}
        height={height}
      />
    </div>
  );
};

export const NotebookChunk: React.FC<INotebookChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <NotebookInner options={options} />
    </JupyterReactTheme>
  );
};

export default NotebookChunk;
