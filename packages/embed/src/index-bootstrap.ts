/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @datalayer/jupyter-embed - Ultra-minimal Bootstrap
 *
 * This is the absolute bare minimum entry point for code splitting.
 * It contains ONLY the parser logic and delegates all rendering to
 * dynamic imports of specific component chunks.
 */

// Types - no runtime cost (stripped at build time)
export type {
  EmbedOptions,
  ICellEmbedOptions,
  INotebookEmbedOptions,
  IViewerEmbedOptions,
  ITerminalEmbedOptions,
  IConsoleEmbedOptions,
  IOutputEmbedOptions,
  IEmbedElementOptions,
} from './types';

import { DATA_ATTRIBUTES } from './types';
export { DATA_ATTRIBUTES };

// Configuration - tiny
import {
  configureJupyterEmbed,
  getJupyterEmbedConfig,
  parseConfigFromScript,
} from './config';
export {
  configureJupyterEmbed,
  getJupyterEmbedConfig,
  parseConfigFromScript,
  type IJupyterEmbedConfig,
} from './config';

// Parser - tiny
import { parseElementOptions } from './parser';
export { parseElementOptions };

/**
 * Show loading indicator in element
 */
function showLoader(element: HTMLElement, type: string, height: string): void {
  element.innerHTML = `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: ${height};
      gap: 12px;
      background-color: #f6f8fa;
      border-radius: 6px;
      border: 1px solid #d0d7de;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    " role="status">
      <div style="
        width: 24px;
        height: 24px;
        border: 3px solid #d0d7de;
        border-top-color: #0969da;
        border-radius: 50%;
        animation: jupyter-spin 1s linear infinite;
      "></div>
      <style>@keyframes jupyter-spin { to { transform: rotate(360deg); } }</style>
      <div style="color: #656d76; font-size: 14px;">Loading Jupyter ${type}...</div>
    </div>
  `;
}

/**
 * Render function that dynamically imports the specific component chunk
 */
export async function renderEmbed(
  element: HTMLElement,
  options: import('./types').EmbedOptions,
): Promise<any> {
  const height = options.height || '200px';
  showLoader(element, options.type, height);

  // Dynamic import the specific chunk based on type
  // Each chunk is a separate file that loads independently
  let ChunkComponent: any;

  switch (options.type) {
    case 'cell':
      ChunkComponent = (await import('./chunks/CellChunk')).CellChunk;
      break;
    case 'notebook':
      ChunkComponent = (await import('./chunks/NotebookChunk')).NotebookChunk;
      break;
    case 'output':
      ChunkComponent = (await import('./chunks/OutputChunk')).OutputChunk;
      break;
    case 'terminal':
      ChunkComponent = (await import('./chunks/TerminalChunk')).TerminalChunk;
      break;
    case 'console':
      ChunkComponent = (await import('./chunks/ConsoleChunk')).ConsoleChunk;
      break;
    case 'viewer':
      ChunkComponent = (await import('./chunks/ViewerChunk')).ViewerChunk;
      break;
    default:
      console.error(
        '[jupyter-embed] Unknown component type:',
        (options as any).type,
      );
      return null;
  }

  // Now import React and render
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');

  element.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'jupyter-embed-container';
  container.style.width = '100%';
  container.style.height = '100%';
  element.appendChild(container);

  const root = createRoot(container);
  root.render(React.createElement(ChunkComponent, { options }));

  element.setAttribute('data-jupyter-initialized', 'true');
  return root;
}

/**
 * Initialize all embed elements in the document
 */
export async function initJupyterEmbeds(
  container: HTMLElement = document.body,
): Promise<void> {
  const config = getJupyterEmbedConfig();
  const selector = `[${DATA_ATTRIBUTES.JUPYTER_EMBED}]`;
  const elements = container.querySelectorAll<HTMLElement>(selector);

  if (elements.length === 0) {
    return;
  }

  console.log(`[jupyter-embed] Found ${elements.length} embed element(s)`);

  // Setup IntersectionObserver for lazy loading
  if (config.lazyLoad && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            observer.unobserve(element);

            const options = parseElementOptions(element);
            if (options) {
              renderEmbed(element, options);
            }
          }
        });
      },
      { rootMargin: '100px' },
    );

    elements.forEach(element => {
      if (element.getAttribute('data-jupyter-initialized') !== 'true') {
        observer.observe(element);
      }
    });
  } else {
    // Initialize all elements immediately
    for (const element of elements) {
      if (element.getAttribute('data-jupyter-initialized') !== 'true') {
        const options = parseElementOptions(element);
        if (options) {
          await renderEmbed(element, options);
        }
      }
    }
  }
}

/**
 * Auto-initialize on page load
 */
function autoInit(): void {
  // Find our script tag and parse config from it
  const scripts = document.querySelectorAll('script[src*="jupyter-embed"]');
  scripts.forEach(script => {
    const config = parseConfigFromScript(script as HTMLScriptElement);
    if (Object.keys(config).length > 0) {
      configureJupyterEmbed(config);
    }
  });

  // Also check for a config script tag
  const configScript = document.querySelector(
    'script[data-jupyter-embed-config]',
  );
  if (configScript?.textContent) {
    try {
      const config = JSON.parse(configScript.textContent);
      configureJupyterEmbed(config);
    } catch (e) {
      console.warn('[jupyter-embed] Failed to parse config script:', e);
    }
  }

  // Initialize all embeds
  initJupyterEmbeds();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }
}

export { autoInit };
