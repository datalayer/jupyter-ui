/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Console component chunk
 */

import React from 'react';
import { Console, useJupyter } from '@datalayer/jupyter-react';
import type { IConsoleEmbedOptions } from '../types';

// Get core from global
const core = (window as any).JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Console embed component
 */
const ConsoleEmbedInner: React.FC<{ options: IConsoleEmbedOptions }> = ({ options }) => {
  const { defaultKernel, serviceManager } = useJupyter();

  if (!serviceManager || !defaultKernel) {
    return <div>Loading Jupyter kernel...</div>;
  }

  return (
    <div style={{ height: options.height || '400px' }}>
      <Console
        height={options.height || '400px'}
      />
    </div>
  );
};

/**
 * Render console into element
 */
function renderConsole(element: HTMLElement, options: IConsoleEmbedOptions): void {
  const config = getConfig();
  const root = createEmbedRoot(element);
  
  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={config.autoStartKernel}
      defaultKernel={config.defaultKernel}
    >
      <ConsoleEmbedInner options={options} />
    </JupyterWrapper>
  );
}

// Register with core
core.registerComponent('console', renderConsole);

// Export for direct use
export { renderConsole, ConsoleEmbedInner };

// Make available globally
(window as any).JupyterEmbed_console = { renderConsole };
