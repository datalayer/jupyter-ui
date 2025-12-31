/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @datalayer/jupyter-embed - Lazy Loading Entry Point
 *
 * This entry point uses dynamic imports to load components on-demand,
 * dramatically reducing initial bundle size. The core bootstrap is tiny
 * (~50KB), and each component chunk is loaded only when needed.
 *
 * Usage:
 *   <script type="module" src="https://cdn/jupyter-embed.lazy.js"></script>
 */

// Configuration - always loaded (tiny)
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

// Parser - always loaded (tiny)
export { parseElementOptions } from './parser';

// Lazy Components - loaded on-demand
export {
  renderEmbedLazy as renderEmbed,
  unmountEmbedLazy as unmountEmbed,
  unmountAllEmbedsLazy as unmountAllEmbeds,
  JupyterLoader,
  LazyCellEmbed,
  LazyNotebookEmbed,
  LazyViewerEmbed,
  LazyTerminalEmbed,
  LazyConsoleEmbed,
  LazyOutputEmbed,
} from './components-lazy';

// Lazy initialization
export {
  initJupyterEmbedsLazy as initJupyterEmbeds,
  initAddedJupyterEmbedsLazy as initAddedJupyterEmbeds,
  destroyJupyterEmbedsLazy as destroyJupyterEmbeds,
  autoInitLazy as autoInit,
} from './init-lazy';
