/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PageConfig } from '@jupyterlab/coreutils';
import { JupyterProps } from './Jupyter';

/**
 * The URL prefix for the kernel api.
 */
const API_KERNEL_PREFIX_URL = '/api/kernel';

/**
 * Type of the Jupyter configuration.
 */
export type IJupyterConfig = {
  jupyterServerHttpUrl: string;
  jupyterServerWsUrl: string;
  jupyterToken: string;
  insideJupyterLab: boolean;
  insideJupyterHub: boolean;
};

/**
 * The default Jupyter configuration.
 */
let config: IJupyterConfig = {
  jupyterServerHttpUrl: '',
  jupyterServerWsUrl: '',
  jupyterToken: '',
  insideJupyterLab: false,
  insideJupyterHub: false,
};

/**
 * Datalayer configuration is loaded.
 */
let datalayerConfigLoaded = false;

/**
 * Jupyter configuration is loaded.
 */
let jupyterConfigLoaded = false;

/**
 * Setter for jupyterServerHttpUrl.
 */
export const setJupyterServerHttpUrl = (jupyterServerHttpUrl: string) => {
  config.jupyterServerHttpUrl = jupyterServerHttpUrl;
};
/**
 * Getter for jupyterServerHttpUrl.
 */
export const getJupyterServerHttpUrl = () => config.jupyterServerHttpUrl;

/**
 * Setter for jupyterServerWsUrl.
 */
export const setJupyterServerWsUrl = (jupyterServerWsUrl: string) => {
  config.jupyterServerWsUrl = jupyterServerWsUrl;
};
/**
 * Getter for jupyterServerWsUrl.
 */
export const getJupyterServerWsUrl = () => config.jupyterServerWsUrl;

/**
 * Setter for jupyterToken.
 */
export const setJupyterToken = (jupyterToken: string) => {
  config.jupyterToken = jupyterToken;
};
/**
 * Getter for jupyterToken.
 */
export const getJupyterToken = () => config.jupyterToken;

/**
 * Get the datalayer configuration fully or for a particular parameter.
 *
 * @param name The parameter name
 * @returns The parameter value if {@link name} is specified, otherwise the full configuration.
 */
export function getDatalayerConfig(name?: string): any {
  if (!datalayerConfigLoaded) {
    const datalayerConfigData = document.getElementById(
      'datalayer-config-data'
    );
    if (datalayerConfigData?.textContent) {
      try {
        config = { ...config, ...JSON.parse(datalayerConfigData.textContent) };
        datalayerConfigLoaded = true;
      } catch (error) {
        console.error('Failed to parse the Datalayer configuration.', error);
      }
    }
  }
  // @ts-expect-error IJupyterConfig does not have index signature
  return name ? config[name] : config;
}

/**
 * Method to load the Jupyter configuration from the
 * host HTML page.
 */
export const loadJupyterConfig = (
  props: Pick<
    JupyterProps,
    | 'lite'
    | 'jupyterServerHttpUrl'
    | 'jupyterServerWsUrl'
    | 'collaborative'
    | 'terminals'
    | 'jupyterToken'
  >
) => {
  const {
    lite,
    jupyterServerHttpUrl,
    jupyterServerWsUrl,
    collaborative,
    terminals,
    jupyterToken,
  } = props;
  if (jupyterConfigLoaded) {
    // Bail, the Jupyter config is already loaded.
    return config;
  }
  // Load the Datalayer config.
  getDatalayerConfig();
  if (datalayerConfigLoaded) {
    // There is a Datalayer config, rely on that.
    setJupyterServerHttpUrl(
      jupyterServerHttpUrl ??
        config.jupyterServerHttpUrl ??
        location.protocol + '//' + location.host + '/api/jupyter'
    );
    setJupyterServerWsUrl(
      jupyterServerWsUrl ??
        config.jupyterServerWsUrl ??
        location.protocol.replace(/^http/, 'ws') +
          '//' +
          location.host +
          '/api/jupyter'
    );
    setJupyterToken(jupyterToken ?? config.jupyterToken ?? '');
  } else {
    // No Datalayer config, look for a Jupyter config.
    const jupyterConfigData = document.getElementById('jupyter-config-data');
    if (jupyterConfigData) {
      const jupyterConfig = JSON.parse(jupyterConfigData.textContent || '');
      setJupyterServerHttpUrl(
        jupyterServerHttpUrl ??
          location.protocol + '//' + location.host + jupyterConfig.baseUrl
      );
      setJupyterServerWsUrl(
        jupyterServerWsUrl ?? getJupyterServerHttpUrl().replace(/^http/, 'ws')
      );
      setJupyterToken(jupyterToken ?? jupyterConfig.token);
      config.insideJupyterLab = jupyterConfig.appName === 'JupyterLab';
      // Hub related information ('hubHost' 'hubPrefix' 'hubUser' ,'hubServerName').
      config.insideJupyterHub = PageConfig.getOption('hubHost') !== '';
    } else {
      // No Datalayer and no Jupyter config, rely on location...
      setJupyterServerHttpUrl(
        jupyterServerHttpUrl ??
          location.protocol + '//' + location.host + API_KERNEL_PREFIX_URL
      );
      setJupyterServerWsUrl(
        jupyterServerWsUrl ??
          location.protocol.replace(/^http/, 'ws') +
            '//' +
            location.host +
            API_KERNEL_PREFIX_URL
      );
      setJupyterToken(jupyterToken ?? '');
    }
  }
  jupyterConfigLoaded = true;
  if (lite) {
    setJupyterServerHttpUrl(location.protocol + '//' + location.host);
    setJupyterServerWsUrl(
      location.protocol === 'https:'
        ? 'wss://' + location.host
        : 'ws://' + location.host
    );
  }
  if (config.insideJupyterLab) {
    // Bail if running inisde JupyterLab, we don't want to change the existing PageConfig.
    return config;
  }
  PageConfig.setOption('baseUrl', getJupyterServerHttpUrl());
  PageConfig.setOption('wsUrl', getJupyterServerWsUrl());
  PageConfig.setOption('token', getJupyterToken());
  PageConfig.setOption('collaborative', String(collaborative));
  PageConfig.setOption('disableRTC', String(!collaborative));
  PageConfig.setOption('terminalsAvailable', String(terminals));
  PageConfig.setOption(
    'mathjaxUrl',
    'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js'
  );
  PageConfig.setOption('mathjaxConfig', 'TeX-AMS_CHTML-full,Safe');
  return config;
};
