/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @datalayer/jupyter-embed - Minimal Bootstrap Entry Point
 *
 * This is the absolute minimum entry point - just the parser and render function.
 * No components are loaded until actually needed.
 *
 * Usage:
 *   <script type="module" src="https://cdn/jupyter-embed.min.js"></script>
 *   <script>
 *     // Manual initialization
 *     JupyterEmbed.configureJupyterEmbed({ serverUrl: '...' });
 *     JupyterEmbed.initJupyterEmbeds();
 *   </script>
 */

// Configuration - always needed
export {
  configureJupyterEmbed,
  getJupyterEmbedConfig,
  parseConfigFromScript,
  type IJupyterEmbedConfig,
} from './config';

// Types - no runtime cost
export {
  type EmbedOptions,
  type ICellEmbedOptions,
  type INotebookEmbedOptions,
  type IViewerEmbedOptions,
  type ITerminalEmbedOptions,
  type IConsoleEmbedOptions,
  type IOutputEmbedOptions,
  type IEmbedElementOptions,
  DATA_ATTRIBUTES,
} from './types';

// Parser - always needed
export { parseElementOptions } from './parser';

// Lazy Components - loaded on-demand (no auto-init!)
export {
  renderEmbedLazy as renderEmbed,
  unmountEmbedLazy as unmountEmbed,
  unmountAllEmbedsLazy as unmountAllEmbeds,
  JupyterLoader,
} from './components-lazy';

// Initialization functions - but NOT auto-init
export {
  initJupyterEmbedsLazy as initJupyterEmbeds,
  initAddedJupyterEmbedsLazy as initAddedJupyterEmbeds,
  destroyJupyterEmbedsLazy as destroyJupyterEmbeds,
} from './init-lazy-manual';
