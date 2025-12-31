/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Viewer component chunk
 */

import React from 'react';
import { Viewer, useJupyter } from '@datalayer/jupyter-react';
import type { IViewerEmbedOptions } from '../types';

// Get core from global
declare const window: Window & {
  JupyterEmbedCore: any;
  JupyterEmbed_viewer: any;
};
const core = window.JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Viewer embed component (read-only notebook)
 */
const ViewerEmbedInner: React.FC<{ options: IViewerEmbedOptions }> = ({
  options,
}) => {
  const { serviceManager } = useJupyter();
  const nbformat =
    typeof options.content === 'object' ? options.content : undefined;
  const height = options.height || '500px';

  if (!serviceManager && !nbformat && !options.outputs) {
    return <div>Loading Jupyter services...</div>;
  }

  return (
    <div style={{ height }}>
      <Viewer
        nbformat={nbformat}
        nbformatUrl={options.url}
        outputs={options.outputs ?? false}
      />
    </div>
  );
};

/**
 * Render viewer into element
 */
function renderViewer(
  element: HTMLElement,
  options: IViewerEmbedOptions,
): void {
  const config = getConfig();
  const root = createEmbedRoot(element);

  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={false}
      defaultKernel={config.defaultKernel}
    >
      <ViewerEmbedInner options={options} />
    </JupyterWrapper>,
  );
}

// Register with core
core.registerComponent('viewer', renderViewer);

// Export for direct use
export { renderViewer, ViewerEmbedInner };

// Make available globally
window.JupyterEmbed_viewer = { renderViewer };
