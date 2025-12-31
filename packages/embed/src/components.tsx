/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  Jupyter,
  Cell,
  Notebook,
  Terminal,
  Console,
  Output,
} from '@datalayer/jupyter-react';
import { getJupyterEmbedConfig } from './config';
import {
  EmbedOptions,
  ICellEmbedOptions,
  INotebookEmbedOptions,
  ITerminalEmbedOptions,
  IConsoleEmbedOptions,
  IOutputEmbedOptions,
} from './types';

/**
 * Wrapper component that provides Jupyter context
 */
interface IJupyterWrapperProps {
  children: React.ReactNode;
}

const JupyterWrapper: React.FC<IJupyterWrapperProps> = ({ children }) => {
  const config = getJupyterEmbedConfig();

  return (
    <Jupyter
      jupyterServerUrl={config.serverUrl || ''}
      jupyterServerToken={config.token || ''}
      startDefaultKernel={config.autoStartKernel}
      defaultKernelName={config.defaultKernel}
      collaborative={false}
      terminals={true}
    >
      {children}
    </Jupyter>
  );
};

/**
 * Cell embed component
 */
interface ICellEmbedProps {
  options: ICellEmbedOptions;
}

const CellEmbed: React.FC<ICellEmbedProps> = ({ options }) => {
  return (
    <JupyterWrapper>
      <div style={{ height: options.height || '200px' }}>
        <Cell
          id={options.id}
          source={options.source || ''}
          type={options.cellType || 'code'}
          autoStart={options.autoExecute}
          showToolbar={options.showToolbar}
        />
      </div>
    </JupyterWrapper>
  );
};

/**
 * Notebook embed component
 */
interface INotebookEmbedProps {
  options: INotebookEmbedOptions;
}

const NotebookEmbed: React.FC<INotebookEmbedProps> = ({ options }) => {
  const nbformat =
    typeof options.content === 'object' ? options.content : undefined;

  return (
    <JupyterWrapper>
      <div style={{ height: options.height || '500px' }}>
        <Notebook
          id={options.id || 'embedded-notebook'}
          path={options.path}
          nbformat={nbformat as any}
          readonly={options.readonly}
        />
      </div>
    </JupyterWrapper>
  );
};

/**
 * Terminal embed component
 */
interface ITerminalEmbedProps {
  options: ITerminalEmbedOptions;
}

const TerminalEmbed: React.FC<ITerminalEmbedProps> = ({ options }) => {
  return (
    <JupyterWrapper>
      <div style={{ height: options.height || '400px' }}>
        <Terminal colorMode={options.colorMode || options.theme || 'light'} />
      </div>
    </JupyterWrapper>
  );
};

/**
 * Console embed component
 */
interface IConsoleEmbedProps {
  options: IConsoleEmbedOptions;
}

const ConsoleEmbed: React.FC<IConsoleEmbedProps> = ({ options }) => {
  return (
    <JupyterWrapper>
      <div style={{ height: options.height || '400px' }}>
        <Console />
      </div>
    </JupyterWrapper>
  );
};

/**
 * Output embed component
 */
interface IOutputEmbedProps {
  options: IOutputEmbedOptions;
}

const OutputEmbed: React.FC<IOutputEmbedProps> = ({ options }) => {
  return (
    <JupyterWrapper>
      <div style={{ height: options.height || 'auto' }}>
        <Output outputs={options.outputs || []} />
      </div>
    </JupyterWrapper>
  );
};

/**
 * Map to track rendered components
 */
const renderedComponents = new Map<HTMLElement, Root>();

/**
 * Render an embed component into an HTML element
 */
export function renderEmbed(
  element: HTMLElement,
  options: EmbedOptions,
): Root | null {
  // Clean up existing render if any
  const existingRoot = renderedComponents.get(element);
  if (existingRoot) {
    existingRoot.unmount();
    renderedComponents.delete(element);
  }

  // Clear element content
  element.innerHTML = '';

  // Add a container div
  const container = document.createElement('div');
  container.className = 'jupyter-embed-container';
  container.style.width = '100%';
  container.style.height = '100%';
  element.appendChild(container);

  // Create React root and render
  const root = createRoot(container);
  renderedComponents.set(element, root);

  let component: React.ReactElement | null = null;

  switch (options.type) {
    case 'cell':
      component = <CellEmbed options={options} />;
      break;
    case 'notebook':
      component = <NotebookEmbed options={options} />;
      break;
    case 'terminal':
      component = <TerminalEmbed options={options} />;
      break;
    case 'console':
      component = <ConsoleEmbed options={options} />;
      break;
    case 'output':
      component = <OutputEmbed options={options} />;
      break;
    default:
      console.error('[jupyter-embed] Unknown component type');
      return null;
  }

  root.render(component);
  return root;
}

/**
 * Unmount an embed from an element
 */
export function unmountEmbed(element: HTMLElement): boolean {
  const root = renderedComponents.get(element);
  if (root) {
    root.unmount();
    renderedComponents.delete(element);
    return true;
  }
  return false;
}

/**
 * Unmount all embeds
 */
export function unmountAllEmbeds(): void {
  renderedComponents.forEach(root => {
    root.unmount();
  });
  renderedComponents.clear();
}

// Export components for direct use
export {
  JupyterWrapper,
  CellEmbed,
  NotebookEmbed,
  TerminalEmbed,
  ConsoleEmbed,
  OutputEmbed,
};
