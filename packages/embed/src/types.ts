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

  /**
   * Code to execute (optional)
   */
  code?: string;

  /**
   * Auto-run code on load
   */
  autoRun?: boolean;
}

/**
 * Options specific to Viewer embeds (read-only notebook display)
 */
export interface IViewerEmbedOptions extends IEmbedElementOptions {
  type: 'viewer';

  /**
   * Notebook path to load from Jupyter server
   */
  path?: string;

  /**
   * URL to fetch notebook JSON from
   */
  url?: string;

  /**
   * Inline notebook content (nbformat)
   */
  content?: any;

  /**
   * Whether to show outputs (default: true)
   */
  outputs?: boolean;
}

/**
 * Union type of all embed options
 */
export type EmbedOptions =
  | ICellEmbedOptions
  | INotebookEmbedOptions
  | IViewerEmbedOptions
  | ITerminalEmbedOptions
  | IConsoleEmbedOptions
  | IOutputEmbedOptions;

/**
 * Data attributes used on HTML elements for auto-initialization
 * Supports both short form (data-type) and prefixed form (data-jupyter-type)
 */
export const DATA_ATTRIBUTES = {
  // Main marker
  JUPYTER_EMBED: 'data-jupyter-embed',

  // Component type
  TYPE: 'data-type',

  // Common options (short form)
  ID: 'data-id',
  HEIGHT: 'data-height',
  THEME: 'data-theme',
  AUTO_EXECUTE: 'data-auto-execute',

  // Common options (prefixed form)
  JUPYTER_HEIGHT: 'data-jupyter-height',
  JUPYTER_THEME: 'data-jupyter-theme',
  JUPYTER_AUTO_EXECUTE: 'data-jupyter-auto-execute',

  // Cell options
  CELL_TYPE: 'data-cell-type',
  SOURCE: 'data-source',
  SHOW_TOOLBAR: 'data-show-toolbar',
  KERNEL: 'data-kernel',

  // Cell options (prefixed form)
  JUPYTER_CELL_TYPE: 'data-jupyter-cell-type',
  JUPYTER_SOURCE: 'data-jupyter-source',
  JUPYTER_SHOW_TOOLBAR: 'data-jupyter-show-toolbar',
  JUPYTER_KERNEL: 'data-jupyter-kernel',

  // Notebook options
  PATH: 'data-path',
  URL: 'data-url',
  READONLY: 'data-readonly',

  // Notebook options (prefixed form)
  JUPYTER_PATH: 'data-jupyter-path',
  JUPYTER_URL: 'data-jupyter-url',
  JUPYTER_READONLY: 'data-jupyter-readonly',

  // Terminal options
  TERMINAL_NAME: 'data-terminal-name',
  COLOR_MODE: 'data-color-mode',

  // Terminal options (prefixed form)
  JUPYTER_TERMINAL_NAME: 'data-jupyter-terminal-name',
  JUPYTER_COLOR_MODE: 'data-jupyter-color-mode',

  // Console options
  INIT_CODE: 'data-init-code',
  JUPYTER_INIT_CODE: 'data-jupyter-init-code',

  // Output options
  AUTO_RUN: 'data-auto-run',
  CODE: 'data-code',
  JUPYTER_AUTO_RUN: 'data-jupyter-auto-run',
  JUPYTER_CODE: 'data-jupyter-code',

  // Content holders (short form uses data-type="x", prefixed form uses data-jupyter-x)
  CONTENT_PRE_EXECUTE: 'pre-execute-code',
  CONTENT_SOURCE: 'source-code',
  CONTENT_SOLUTION: 'solution-code',
  CONTENT_HINT: 'hint',
  // Prefixed content holders
  JUPYTER_CONTENT_PRE_EXECUTE: 'data-jupyter-pre-execute-code',
  JUPYTER_CONTENT_SOURCE: 'data-jupyter-source-code',
  JUPYTER_CONTENT_SOLUTION: 'data-jupyter-solution-code',
  JUPYTER_CONTENT_HINT: 'data-jupyter-hint',
} as const;
