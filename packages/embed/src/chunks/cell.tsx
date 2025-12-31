/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Cell component chunk
 */

import React from 'react';
import { Cell, useJupyter } from '@datalayer/jupyter-react';
import type { ICellEmbedOptions } from '../types';

// Get core from global
const core = (window as any).JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Cell embed component
 */
const CellEmbedInner: React.FC<{ options: ICellEmbedOptions }> = ({ options }) => {
  const { defaultKernel } = useJupyter();

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

/**
 * Render cell into element
 */
function renderCell(element: HTMLElement, options: ICellEmbedOptions): void {
  const config = getConfig();
  const root = createEmbedRoot(element);
  
  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={config.autoStartKernel}
      defaultKernel={config.defaultKernel}
    >
      <CellEmbedInner options={options} />
    </JupyterWrapper>
  );
}

// Register with core
core.registerComponent('cell', renderCell);

// Export for direct use
export { renderCell, CellEmbedInner };

// Make available globally
(window as any).JupyterEmbed_cell = { renderCell };
