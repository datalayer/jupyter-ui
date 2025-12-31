/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Viewer Chunk - Contains notebook viewing dependencies (read-only)
 * This is a lighter chunk as it doesn't need kernel execution support
 */

import React from 'react';
import { JupyterReactTheme, Viewer } from '@datalayer/jupyter-react';
import type { IViewerEmbedOptions } from '../types';

interface IViewerChunkProps {
  options: IViewerEmbedOptions;
}

const ViewerInner: React.FC<IViewerChunkProps> = ({ options }) => {
  const nbformat =
    typeof options.content === 'object' ? options.content : undefined;

  return (
    <div style={{ height: options.height || 'auto' }}>
      <Viewer
        nbformat={nbformat as any}
        nbformatUrl={options.url}
        outputs={options.outputs !== false}
      />
    </div>
  );
};

export const ViewerChunk: React.FC<IViewerChunkProps> = ({ options }) => {
  return (
    <JupyterReactTheme>
      <ViewerInner options={options} />
    </JupyterReactTheme>
  );
};

export default ViewerChunk;
