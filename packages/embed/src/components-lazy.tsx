/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lazy-loaded embed components
 *
 * This module provides components that are dynamically imported only when needed,
 * enabling proper code splitting. Each component type is loaded on-demand.
 *
 * IMPORTANT: This file should NOT import anything from @datalayer/jupyter-react
 * directly to avoid pulling in heavy dependencies into the main bundle.
 */

import React, { lazy, Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  EmbedOptions,
  ICellEmbedOptions,
  INotebookEmbedOptions,
  ITerminalEmbedOptions,
  IConsoleEmbedOptions,
  IOutputEmbedOptions,
  IViewerEmbedOptions,
} from './types';

/**
 * Lightweight skeleton loader component
 */
const JupyterLoader: React.FC<{ height?: string; type?: string }> = ({
  height = '200px',
  type = 'component',
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height,
      gap: '12px',
      backgroundColor: '#f6f8fa',
      borderRadius: '6px',
      border: '1px solid #d0d7de',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}
    role="status"
  >
    <div
      style={{
        width: '24px',
        height: '24px',
        border: '3px solid #d0d7de',
        borderTopColor: '#0969da',
        borderRadius: '50%',
        animation: 'jupyter-spin 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes jupyter-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
    <div style={{ color: '#656d76', fontSize: '14px' }}>
      Loading Jupyter {type}...
    </div>
  </div>
);

// ============================================================================
// Lazy-loaded component factories
// ============================================================================

/**
 * Create a lazy-loaded component module
 * This ensures each component type is in its own chunk
 */

// Cell chunk - loads JupyterLab cell dependencies
const LazyCellModule = lazy(() => {
  console.log('[jupyter-embed] Loading CellChunk...');
  return import(
    /* webpackChunkName: "jupyter-cell" */ './chunks/CellChunk'
  ).then(m => {
    console.log('[jupyter-embed] CellChunk loaded!', m);
    return { default: m.CellChunk };
  });
});

// Notebook chunk - loads JupyterLab notebook dependencies
const LazyNotebookModule = lazy(() =>
  import(
    /* webpackChunkName: "jupyter-notebook" */ './chunks/NotebookChunk'
  ).then(m => ({
    default: m.NotebookChunk,
  })),
);

// Output chunk - loads JupyterLab output dependencies
const LazyOutputModule = lazy(() =>
  import(/* webpackChunkName: "jupyter-output" */ './chunks/OutputChunk').then(
    m => ({
      default: m.OutputChunk,
    }),
  ),
);

// Terminal chunk - loads xterm dependencies
const LazyTerminalModule = lazy(() =>
  import(
    /* webpackChunkName: "jupyter-terminal" */ './chunks/TerminalChunk'
  ).then(m => ({
    default: m.TerminalChunk,
  })),
);

// Console chunk - loads JupyterLab console dependencies
const LazyConsoleModule = lazy(() =>
  import(
    /* webpackChunkName: "jupyter-console" */ './chunks/ConsoleChunk'
  ).then(m => ({
    default: m.ConsoleChunk,
  })),
);

// Viewer chunk - lighter, just needs rendering
const LazyViewerModule = lazy(() =>
  import(/* webpackChunkName: "jupyter-viewer" */ './chunks/ViewerChunk').then(
    m => ({
      default: m.ViewerChunk,
    }),
  ),
);

// ============================================================================
// Embed Components with Lazy Loading
// ============================================================================

interface ICellEmbedProps {
  options: ICellEmbedOptions;
}

const CellEmbed: React.FC<ICellEmbedProps> = ({ options }) => (
  <Suspense
    fallback={<JupyterLoader height={options.height || '200px'} type="cell" />}
  >
    <LazyCellModule options={options} />
  </Suspense>
);

interface INotebookEmbedProps {
  options: INotebookEmbedOptions;
}

const NotebookEmbed: React.FC<INotebookEmbedProps> = ({ options }) => (
  <Suspense
    fallback={
      <JupyterLoader height={options.height || '500px'} type="notebook" />
    }
  >
    <LazyNotebookModule options={options} />
  </Suspense>
);

interface IOutputEmbedProps {
  options: IOutputEmbedOptions;
}

const OutputEmbed: React.FC<IOutputEmbedProps> = ({ options }) => (
  <Suspense
    fallback={
      <JupyterLoader height={options.height || '100px'} type="output" />
    }
  >
    <LazyOutputModule options={options} />
  </Suspense>
);

interface ITerminalEmbedProps {
  options: ITerminalEmbedOptions;
}

const TerminalEmbed: React.FC<ITerminalEmbedProps> = ({ options }) => (
  <Suspense
    fallback={
      <JupyterLoader height={options.height || '400px'} type="terminal" />
    }
  >
    <LazyTerminalModule options={options} />
  </Suspense>
);

interface IConsoleEmbedProps {
  options: IConsoleEmbedOptions;
}

const ConsoleEmbed: React.FC<IConsoleEmbedProps> = ({ options }) => (
  <Suspense
    fallback={
      <JupyterLoader height={options.height || '400px'} type="console" />
    }
  >
    <LazyConsoleModule options={options} />
  </Suspense>
);

interface IViewerEmbedProps {
  options: IViewerEmbedOptions;
}

const ViewerEmbed: React.FC<IViewerEmbedProps> = ({ options }) => (
  <Suspense
    fallback={
      <JupyterLoader height={options.height || '300px'} type="viewer" />
    }
  >
    <LazyViewerModule options={options} />
  </Suspense>
);

// ============================================================================
// Render Functions
// ============================================================================

/**
 * Map to track rendered components
 */
const renderedComponents = new Map<HTMLElement, Root>();

/**
 * Render an embed component into an HTML element (lazy version)
 */
export function renderEmbedLazy(
  element: HTMLElement,
  options: EmbedOptions,
): Root | null {
  console.log(
    '[jupyter-embed] renderEmbedLazy called with:',
    options.type,
    options,
  );

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
    case 'viewer':
      component = <ViewerEmbed options={options} />;
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
 * Unmount a lazy embed from an element
 */
export function unmountEmbedLazy(element: HTMLElement): boolean {
  const root = renderedComponents.get(element);
  if (root) {
    root.unmount();
    renderedComponents.delete(element);
    return true;
  }
  return false;
}

/**
 * Unmount all lazy embeds
 */
export function unmountAllEmbedsLazy(): void {
  renderedComponents.forEach(root => {
    root.unmount();
  });
  renderedComponents.clear();
}

// Export components for direct use
export {
  JupyterLoader,
  CellEmbed as LazyCellEmbed,
  NotebookEmbed as LazyNotebookEmbed,
  ViewerEmbed as LazyViewerEmbed,
  TerminalEmbed as LazyTerminalEmbed,
  ConsoleEmbed as LazyConsoleEmbed,
  OutputEmbed as LazyOutputEmbed,
};
