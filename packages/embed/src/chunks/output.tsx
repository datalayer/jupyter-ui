/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Output component chunk
 */

import React from 'react';
import { Output, useJupyter } from '@datalayer/jupyter-react';
import type { IOutputEmbedOptions } from '../types';
import type { IOutput } from '@jupyterlab/nbformat';

// Get core from global
const core = (window as any).JupyterEmbedCore;
const { createEmbedRoot, JupyterWrapper, getConfig } = core;

/**
 * Output embed component
 */
const OutputEmbedInner: React.FC<{ options: IOutputEmbedOptions }> = ({ options }) => {
  const { defaultKernel } = useJupyter();

  // If outputs are provided directly, render them
  if (options.outputs && options.outputs.length > 0) {
    return (
      <div style={{ height: options.height || 'auto' }}>
        <Output
          outputs={options.outputs as IOutput[]}
          showControl={false}
          showKernelProgressBar={false}
        />
      </div>
    );
  }

  // If code is provided, execute it
  if (options.code) {
    return (
      <div style={{ height: options.height || 'auto' }}>
        <Output
          code={options.code}
          autoRun={options.autoRun !== false}
          kernel={defaultKernel}
          showControl={false}
          showKernelProgressBar={true}
          outputs={[]}
        />
      </div>
    );
  }

  // Fallback: empty output
  return (
    <div style={{ height: options.height || 'auto' }}>
      <Output
        outputs={[]}
        showControl={false}
        showKernelProgressBar={false}
      />
    </div>
  );
};

/**
 * Render output into element
 */
function renderOutput(element: HTMLElement, options: IOutputEmbedOptions): void {
  const config = getConfig();
  const root = createEmbedRoot(element);
  
  root.render(
    <JupyterWrapper
      serverUrl={config.serverUrl}
      token={config.token}
      autoStartKernel={config.autoStartKernel}
      defaultKernel={config.defaultKernel}
    >
      <OutputEmbedInner options={options} />
    </JupyterWrapper>
  );
}

// Register with core
core.registerComponent('output', renderOutput);

// Export for direct use
export { renderOutput, OutputEmbedInner };

// Make available globally
(window as any).JupyterEmbed_output = { renderOutput };
