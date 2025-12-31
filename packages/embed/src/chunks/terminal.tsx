/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Terminal component chunk
 */

import React from 'react';
import { Terminal, useJupyter } from '@datalayer/jupyter-react';
import type { ITerminalEmbedOptions } from '../types';

// Get core from global
const core = (window as any).JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Terminal embed component
 */
const TerminalEmbedInner: React.FC<{ options: ITerminalEmbedOptions }> = ({ options }) => {
  const { serviceManager } = useJupyter();

  if (!serviceManager) {
    return <div>Loading Jupyter services...</div>;
  }

  return (
    <div style={{ height: options.height || '400px' }}>
      <Terminal
        height={options.height || '400px'}
        colormode={options.theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
};

/**
 * Render terminal into element
 */
function renderTerminal(element: HTMLElement, options: ITerminalEmbedOptions): void {
  const config = getConfig();
  const root = createEmbedRoot(element);
  
  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={false}
      defaultKernel={config.defaultKernel}
    >
      <TerminalEmbedInner options={options} />
    </JupyterWrapper>
  );
}

// Register with core
core.registerComponent('terminal', renderTerminal);

// Export for direct use
export { renderTerminal, TerminalEmbedInner };

// Make available globally
(window as any).JupyterEmbed_terminal = { renderTerminal };
