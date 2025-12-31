/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Configuration options for Jupyter Embed
 */
export interface IJupyterEmbedConfig {
  /**
   * Base URL for the Jupyter server (e.g., 'http://localhost:8888')
   */
  serverUrl?: string;

  /**
   * WebSocket URL for the Jupyter server (e.g., 'ws://localhost:8888')
   * If not provided, it will be derived from serverUrl
   */
  wsUrl?: string;

  /**
   * Authentication token for the Jupyter server
   */
  token?: string;

  /**
   * Default kernel name to use (e.g., 'python3')
   */
  defaultKernel?: string;

  /**
   * Whether to start kernel automatically
   */
  autoStartKernel?: boolean;

  /**
   * Whether to lazy load components (only initialize when visible)
   */
  lazyLoad?: boolean;

  /**
   * Theme to use ('light' or 'dark')
   */
  theme?: 'light' | 'dark';

  /**
   * Base path for the Jupyter server
   */
  basePath?: string;
}

/**
 * Global configuration instance
 */
let globalConfig: IJupyterEmbedConfig = {
  serverUrl: '',
  token: '',
  defaultKernel: 'python3',
  autoStartKernel: true,
  lazyLoad: true,
  theme: 'light',
  basePath: '/',
};

/**
 * Configure Jupyter Embed globally
 */
export function configureJupyterEmbed(
  config: Partial<IJupyterEmbedConfig>,
): void {
  globalConfig = { ...globalConfig, ...config };

  // Derive wsUrl from serverUrl if not provided
  if (config.serverUrl && !config.wsUrl) {
    globalConfig.wsUrl = config.serverUrl
      .replace('https://', 'wss://')
      .replace('http://', 'ws://');
  }
}

/**
 * Get the current global configuration
 */
export function getJupyterEmbedConfig(): IJupyterEmbedConfig {
  return { ...globalConfig };
}

/**
 * Parse configuration from a script tag's data attributes
 * Supports both data-server-url and data-jupyter-server-url patterns
 */
export function parseConfigFromScript(
  script: HTMLScriptElement,
): Partial<IJupyterEmbedConfig> {
  const config: Partial<IJupyterEmbedConfig> = {};

  // Support both data-server-url and data-jupyter-server-url
  if (script.dataset.serverUrl || script.dataset.jupyterServerUrl) {
    config.serverUrl = script.dataset.serverUrl || script.dataset.jupyterServerUrl;
  }
  if (script.dataset.wsUrl || script.dataset.jupyterWsUrl) {
    config.wsUrl = script.dataset.wsUrl || script.dataset.jupyterWsUrl;
  }
  if (script.dataset.token || script.dataset.jupyterToken) {
    config.token = script.dataset.token || script.dataset.jupyterToken;
  }
  if (script.dataset.kernel || script.dataset.jupyterKernel) {
    config.defaultKernel = script.dataset.kernel || script.dataset.jupyterKernel;
  }
  if (script.dataset.autoStart !== undefined || script.dataset.jupyterAutoStart !== undefined) {
    const val = script.dataset.autoStart ?? script.dataset.jupyterAutoStart;
    config.autoStartKernel = val !== 'false';
  }
  if (script.dataset.lazyLoad !== undefined || script.dataset.jupyterLazyLoad !== undefined) {
    const val = script.dataset.lazyLoad ?? script.dataset.jupyterLazyLoad;
    config.lazyLoad = val !== 'false';
  }
  if (script.dataset.theme || script.dataset.jupyterTheme) {
    config.theme = (script.dataset.theme || script.dataset.jupyterTheme) as 'light' | 'dark';
  }
  if (script.dataset.basePath || script.dataset.jupyterBasePath) {
    config.basePath = script.dataset.basePath || script.dataset.jupyterBasePath;
  }

  return config;
}
