/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Notebook component chunk
 */

import React from 'react';
import { Notebook, useJupyter } from '@datalayer/jupyter-react';
import type { INotebookEmbedOptions } from '../types';

// Get core from global
const core = (window as any).JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Notebook embed component
 */
const NotebookEmbedInner: React.FC<{ options: INotebookEmbedOptions }> = ({ options }) => {
  const { serviceManager, defaultKernel } = useJupyter();
  const nbformat = typeof options.content === 'object' ? options.content as any : undefined;
  const height = options.height || '500px';

  if (!serviceManager) {
    return <div>Loading Jupyter services...</div>;
  }

  return (
    <div style={{ height }}>
      <Notebook
        path={options.path}
        url={options.url}
        nbformat={nbformat}
        kernel={defaultKernel}
        startDefaultKernel={true}
        Toolbar={options.showToolbar ? undefined : () => null}
        height={height}
      />
    </div>
  );
};

/**
 * Render notebook into element
 */
function renderNotebook(element: HTMLElement, options: INotebookEmbedOptions): void {
  const config = getConfig();
  const root = createEmbedRoot(element);
  
  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={config.autoStartKernel}
      defaultKernel={config.defaultKernel}
    >
      <NotebookEmbedInner options={options} />
    </JupyterWrapper>
  );
}

// Register with core
core.registerComponent('notebook', renderNotebook);

// Export for direct use
export { renderNotebook, NotebookEmbedInner };

// Make available globally
(window as any).JupyterEmbed_notebook = { renderNotebook };
