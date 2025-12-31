/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @datalayer/jupyter-embed
 *
 * Easily embed Jupyter components (cells, notebooks, terminals, consoles)
 * into any web page.
 */

// Configuration
export {
  configureJupyterEmbed,
  getJupyterEmbedConfig,
  parseConfigFromScript,
  type IJupyterEmbedConfig,
} from './config';

// Types
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

// Parser
export { parseElementOptions } from './parser';

// Components
export {
  renderEmbed,
  unmountEmbed,
  unmountAllEmbeds,
  JupyterWrapper,
  CellEmbed,
  NotebookEmbed,
  ViewerEmbed,
  TerminalEmbed,
  ConsoleEmbed,
  OutputEmbed,
} from './components';

// Initialization
export {
  initJupyterEmbeds,
  initAddedJupyterEmbeds,
  destroyJupyterEmbeds,
  autoInit,
} from './init';

// Re-export useful things from jupyter-react for advanced usage
export {
  JupyterReactTheme,
  Cell,
  Notebook,
  Terminal,
  Console,
  Output,
  Kernel,
  useJupyter,
} from '@datalayer/jupyter-react';
