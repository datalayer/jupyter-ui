/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Base interface for all embed element options
 */
export interface IEmbedElementOptions {
  /**
   * Unique identifier for this element
   */
  id?: string;

  /**
   * Height of the embedded component (CSS value)
   */
  height?: string;

  /**
   * Theme override ('light' or 'dark')
   */
  theme?: 'light' | 'dark';

  /**
   * Whether to auto-execute code on initialization
   */
  autoExecute?: boolean;
}

/**
 * Options specific to Cell embeds
 */
export interface ICellEmbedOptions extends IEmbedElementOptions {
  type: 'cell';

  /**
   * Cell type: 'code', 'markdown', or 'raw'
   */
  cellType?: 'code' | 'markdown' | 'raw';

  /**
   * Source code for the cell
   */
  source?: string;

  /**
   * Whether to show the cell toolbar
   */
  showToolbar?: boolean;

  /**
   * Kernel name to use
   */
  kernel?: string;
}

/**
 * Options specific to Notebook embeds
 */
export interface INotebookEmbedOptions extends IEmbedElementOptions {
  type: 'notebook';

  /**
   * Path to the notebook file on the Jupyter server
   */
  path?: string;

  /**
   * URL to fetch the notebook from
   */
  url?: string;

  /**
   * Notebook content as JSON string or object
   */
  content?: string | object;

  /**
   * Whether the notebook should be read-only
   */
  readonly?: boolean;

  /**
   * Whether to show the notebook toolbar
   */
  showToolbar?: boolean;

  /**
   * Kernel name to use
   */
  kernel?: string;
}

/**
 * Options specific to Terminal embeds
 */
export interface ITerminalEmbedOptions extends IEmbedElementOptions {
  type: 'terminal';

  /**
   * Terminal name (creates new if not exists)
   */
  name?: string;

  /**
   * Whether to colorize the terminal output
   */
  colorMode?: 'light' | 'dark';
}

/**
 * Options specific to Console embeds
 */
export interface IConsoleEmbedOptions extends IEmbedElementOptions {
  type: 'console';

  /**
   * Kernel name to use
   */
  kernel?: string;

  /**
   * Initial code to execute in the console
   */
  initCode?: string;
}

/**
 * Options specific to Output embeds (display only)
 */
export interface IOutputEmbedOptions extends IEmbedElementOptions {
  type: 'output';

  /**
   * Output data to display
   */
  outputs?: any[];
}

/**
 * Union type of all embed options
 */
export type EmbedOptions =
  | ICellEmbedOptions
  | INotebookEmbedOptions
  | ITerminalEmbedOptions
  | IConsoleEmbedOptions
  | IOutputEmbedOptions;

/**
 * Data attributes used on HTML elements for auto-initialization
 */
export const DATA_ATTRIBUTES = {
  // Main marker
  JUPYTER_EMBED: 'data-jupyter-embed',

  // Component type
  TYPE: 'data-type',

  // Common options
  ID: 'data-id',
  HEIGHT: 'data-height',
  THEME: 'data-theme',
  AUTO_EXECUTE: 'data-auto-execute',

  // Cell options
  CELL_TYPE: 'data-cell-type',
  SOURCE: 'data-source',
  SHOW_TOOLBAR: 'data-show-toolbar',
  KERNEL: 'data-kernel',

  // Notebook options
  PATH: 'data-path',
  URL: 'data-url',
  READONLY: 'data-readonly',

  // Terminal options
  TERMINAL_NAME: 'data-terminal-name',
  COLOR_MODE: 'data-color-mode',

  // Console options
  INIT_CODE: 'data-init-code',

  // Content holders
  CONTENT_PRE_EXECUTE: 'pre-execute-code',
  CONTENT_SOURCE: 'source-code',
  CONTENT_SOLUTION: 'solution-code',
  CONTENT_HINT: 'hint',
} as const;
