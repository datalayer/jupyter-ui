/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PageConfig } from '@jupyterlab/coreutils';
import { JupyterProps } from './Jupyter';
import { DEFAULT_JUPYTER_SERVER_URL, DEFAULT_JUPYTER_SERVER_TOKEN } from './JupyterDefaults';

/**
 * The URL prefix for the kernel api.
 */
const API_KERNEL_PREFIX_URL = '/api/jupyter-server';

/**
 * Type of the Jupyter configuration.
 */
export type IJupyterConfig = {
  jupyterServerUrl: string;
  jupyterServerToken: string;
  insideJupyterLab: boolean;
  insideJupyterHub: boolean;
};

/**
 * The current Jupyter configuration.
 */
let config: IJupyterConfig | undefined = undefined;

/**
 * Datalayer configuration is loaded.
 */
let datalayerConfigLoaded = false;

/**
 * Setter for jupyterServerUrl.
 */
const setJupyterServerUrl = (jupyterServerUrl: string) => {
  if (!config) {
    throw new Error("Jupyter React Config must be loaded first.")
  }
  config.jupyterServerUrl = jupyterServerUrl;
};
/**
 * Getter for jupyterServerUrl.
 */
export const getJupyterServerUrl = () => {
  if (!config) {
    throw new Error("Jupyter React Config must be loaded first.")
  }
  return config.jupyterServerUrl;
}


/**
 * Setter for jupyterServerToken.
 */
const setJupyterServerToken = (jupyterServerToken: string) => {
  if (!config) {
    throw new Error("Jupyter React Config must be loaded first.")
  }
  config.jupyterServerToken = jupyterServerToken;
};
/**
 * Getter for jupyterServerToken.
 */
export const getJupyterServerToken = () => {
  if (!config) {
    throw new Error("Jupyter React Config must be loaded first.")
  }
  return config.jupyterServerToken;
}

/**
 * Get the datalayer configuration fully or for a particular parameter.
 *
 * @param name The parameter name
 * @returns The parameter value if {@link name} is specified, otherwise the full configuration.
 */
function loadDatalayerConfig(name?: string): any {
  if (!datalayerConfigLoaded) {
    const datalayerConfigData = document.getElementById(
      'datalayer-config-data'
    );
    if (datalayerConfigData?.textContent) {
      console.log('Found Datalayer config data in page', datalayerConfigData);
      try {
        config = {
          ...config,
          ...JSON.parse(datalayerConfigData.textContent)
        };
        datalayerConfigLoaded = true;
      } catch (error) {
        console.error('Failed to parse the Datalayer configuration.', error);
      }
    }
    else {
      console.log('No Datalayer config data found in page');
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
    | 'collaborative'
    | 'jupyterServerToken'
    | 'jupyterServerUrl'
    | 'lite'
    | 'terminals'
  >
): IJupyterConfig => {
  const {
    collaborative,
    jupyterServerToken,
    jupyterServerUrl,
    lite,
    terminals,
  } = props;
  if (config) {
    console.log('Returning existing Jupyter React config', config);
    return config;
  }
  config = {
    jupyterServerUrl: jupyterServerUrl ?? DEFAULT_JUPYTER_SERVER_TOKEN,
    jupyterServerToken: jupyterServerToken ?? DEFAULT_JUPYTER_SERVER_URL,
    insideJupyterLab: false,
    insideJupyterHub: false,
  }
  // Load the Datalayer config.
  loadDatalayerConfig();
  if (datalayerConfigLoaded) {
    // There is a Datalayer config, mix the configs...
    setJupyterServerUrl(
      jupyterServerUrl ||
        config.jupyterServerUrl
//          location.protocol + '//' + location.host + '/api/jupyter-server'
          
    );
    setJupyterServerToken(
      jupyterServerToken || 
        config.jupyterServerToken
//          ''
    );
  } else {
    // No Datalayer config, look for a Jupyter config.
    const jupyterConfigData = document.getElementById('jupyter-config-data');
    if (jupyterConfigData) {
      const jupyterConfig = JSON.parse(jupyterConfigData.textContent || '');
      setJupyterServerUrl(
        jupyterServerUrl ??
          jupyterConfig.jupyterServerUrl ??
            location.protocol + '//' + location.host + jupyterConfig.baseUrl
      );
      setJupyterServerToken(
        jupyterServerToken ?? 
          jupyterConfig.token ??
            ''
      );
      config.insideJupyterLab = jupyterConfig.appName === 'JupyterLab';
      // Hub related information ('hubHost' 'hubPrefix' 'hubUser' ,'hubServerName').
      config.insideJupyterHub = PageConfig.getOption('hubHost') !== '';
    } else {
      // No Datalayer and no Jupyter config, rely on location...
      setJupyterServerUrl(
        jupyterServerUrl ??
          config.jupyterServerUrl ?? 
            location.protocol + '//' + location.host + API_KERNEL_PREFIX_URL
      );
      setJupyterServerToken(
        jupyterServerToken ??
          config.jupyterServerToken ?? 
            ''
      );
    }
  }
  if (lite) {
    setJupyterServerUrl(location.protocol + '//' + location.host);
  }
  if (! config.insideJupyterLab) {
    // If not inside JupyterLab, mimick JupyerLab behavior...
    PageConfig.setOption('baseUrl', getJupyterServerUrl());
    PageConfig.setOption('wsUrl', getJupyterServerUrl().replace(/^http/, 'ws'));
    PageConfig.setOption('token', getJupyterServerToken());
    PageConfig.setOption('collaborative', String(collaborative));
    PageConfig.setOption('disableRTC', String(!collaborative));
    PageConfig.setOption('terminalsAvailable', String(terminals));
    PageConfig.setOption(
      'mathjaxUrl',
      'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js'
    );
    PageConfig.setOption('mathjaxConfig', 'TeX-AMS_CHTML-full,Safe');
  }
  console.log('Created config for Jupyter React', config)
  return config;
}
