/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { PageConfig } from '@jupyterlab/coreutils';
import {
  DEFAULT_JUPYTER_SERVER_URL,
  DEFAULT_JUPYTER_SERVER_TOKEN,
  DEFAULT_API_KERNEL_PREFIX_URL,
} from './JupyterDefaults';
import { Lite } from './lite';

export type JupyterProps = {
  collaborative?: boolean;
  jupyterServerUrl?: string;
  jupyterServerToken?: string;
  lite?: Lite;
  terminals?: boolean;
};

/**
 * Type definition for the Jupyter Configuration.
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
 * Whether this page is a served JupyterLab, read without writing anything.
 *
 * `loadJupyterConfig` answers the same question, and answering it is the least
 * of what it does: it rebuilds the module configuration and writes `baseUrl`
 * and `wsUrl` into the shared `PageConfig` on the way past. Calling it merely
 * to ask where the code is running therefore *moves* where every Jupyter
 * connection on the page is pointed — and a caller that asks during render
 * does so at a moment nothing else can predict.
 *
 * That is not hypothetical. An in-page JupyterLite kernel points the page at
 * its own origin when it starts; a component asking this question afterwards
 * put the page back on the remote server named in `jupyter-config-data`, and
 * the next kernel connection went there. The symptom is a notebook whose cells
 * run into silence: the kernel is alive and nobody is talking to it.
 *
 * Read once and cached, because the answer is a property of the document and
 * cannot change while the page is open.
 */
let servedByJupyterLab: boolean | undefined;

export const isServedByJupyterLab = (): boolean => {
  if (servedByJupyterLab === undefined) {
    servedByJupyterLab = false;
    try {
      const element = document.getElementById('jupyter-config-data');
      if (element?.textContent) {
        servedByJupyterLab =
          JSON.parse(element.textContent)?.appName === 'JupyterLab';
      }
    } catch {
      // A malformed config is not a JupyterLab, and is not worth a throw
      // during somebody's render.
      servedByJupyterLab = false;
    }
  }
  return servedByJupyterLab;
};

/**
 * Make sure the module configuration exists, without repointing the page.
 *
 * `loadJupyterConfig` does two separable things: it builds this singleton,
 * which four accessors below refuse to work without, and it writes `baseUrl`
 * and `wsUrl` into the shared `PageConfig`. Only the second was ever a
 * problem — a component calling it during render moved every Jupyter
 * connection on the page — and when that call was removed from
 * `JupyterReactTheme` the first went with it. Nothing else in this package
 * called `loadJupyterConfig`, so the singleton stopped being built at all and
 * every one of those accessors began throwing "Jupyter React Config must be
 * loaded first".
 *
 * This is the half that was wanted: it adopts whatever `PageConfig` already
 * says rather than deciding for it, so a JupyterLite kernel that has pointed
 * the page at its own origin keeps it.
 *
 * Idempotent, and safe to call during a render.
 */
export const ensureJupyterConfig = (): IJupyterConfig => {
  if (config) {
    return config;
  }
  const baseUrl = PageConfig.getOption('baseUrl');
  config = {
    // Read, never written. Whoever set `baseUrl` — a JupyterLite server, a
    // host application, JupyterLab itself — is the authority on it.
    jupyterServerUrl: baseUrl || DEFAULT_JUPYTER_SERVER_URL,
    jupyterServerToken:
      PageConfig.getOption('token') || DEFAULT_JUPYTER_SERVER_TOKEN,
    insideJupyterLab: isServedByJupyterLab(),
    insideJupyterHub: PageConfig.getOption('hubHost') !== '',
  };
  return config;
};

/**
 * Setter for jupyterServerUrl.
 */
export const setJupyterServerUrl = (jupyterServerUrl: string) => {
  if (!config) {
    throw new Error('Jupyter React Config must be loaded first.');
  }
  PageConfig.setOption('baseUrl', jupyterServerUrl);
  PageConfig.setOption('wsUrl', jupyterServerUrl.replace(/^http/, 'ws'));
  config.jupyterServerUrl = jupyterServerUrl;
};

/**
 * Getter for jupyterServerUrl.
 */
export const getJupyterServerUrl = () => {
  if (!config) {
    throw new Error('Jupyter React Config must be loaded first.');
  }
  return config.jupyterServerUrl;
};

/**
 * Setter for jupyterServerToken.
 */
export const setJupyterServerToken = (jupyterServerToken: string) => {
  if (!config) {
    throw new Error('Jupyter React Config must be loaded first.');
  }
  PageConfig.setOption('token', jupyterServerToken);
  config.jupyterServerToken = jupyterServerToken;
};

/**
 * Getter for jupyterServerToken.
 */
export const getJupyterServerToken = () => {
  if (!config) {
    throw new Error('Jupyter React Config must be loaded first.');
  }
  return config.jupyterServerToken;
};

/**
 * Reset the Jupyter configuration.
 * This is useful when reusing webviews or remounting the application
 * to ensure stale configuration doesn't persist.
 */
export const resetJupyterConfig = () => {
  config = undefined;
};

/**
 * Method to load the Jupyter configuration from the host HTML page.
 */
export const loadJupyterConfig = (
  props: Partial<JupyterProps> = {}
): IJupyterConfig => {
  const {
    collaborative,
    jupyterServerToken,
    jupyterServerUrl,
    lite,
    terminals,
  } = props;
  /*
  if (config) {
    // console.log('Returning existing Jupyter React config', config);
    return config;
  }
  */
  config = {
    jupyterServerUrl: jupyterServerUrl ?? DEFAULT_JUPYTER_SERVER_URL,
    jupyterServerToken: jupyterServerToken ?? DEFAULT_JUPYTER_SERVER_TOKEN,
    insideJupyterLab: false,
    insideJupyterHub: false,
  };
  // JupyterLab
  const jupyterConfigData = document.getElementById('jupyter-config-data');
  let jupyterConfig = undefined;
  if (jupyterConfigData) {
    jupyterConfig = JSON.parse(jupyterConfigData.textContent || '');
    config.insideJupyterLab = jupyterConfig.appName === 'JupyterLab';
  }
  // Hub related information ('hubHost' 'hubPrefix' 'hubUser' ,'hubServerName').
  config.insideJupyterHub = PageConfig.getOption('hubHost') !== '';
  // Look for a Jupyter config...
  if (jupyterConfig) {
    setJupyterServerUrl(
      jupyterServerUrl ??
        jupyterConfig.baseUrl ??
        location.protocol + '//' + location.host + jupyterConfig.baseUrl
    );
    setJupyterServerToken(jupyterServerToken ?? jupyterConfig.token ?? '');
  } else {
    // No Jupyter config, rely on location...
    setJupyterServerUrl(
      jupyterServerUrl ??
        config.jupyterServerUrl ??
        location.protocol + '//' + location.host + DEFAULT_API_KERNEL_PREFIX_URL
    );
    setJupyterServerToken(
      jupyterServerToken ?? config.jupyterServerToken ?? ''
    );
  }
  if (lite) {
    setJupyterServerUrl(location.protocol + '//' + location.host);
  }
  if (!config.insideJupyterLab && !lite) {
    // If not inside JupyterLab and not lite, mimick JupyterLab behavior...
    PageConfig.setOption('baseUrl', getJupyterServerUrl());
    PageConfig.setOption('wsUrl', getJupyterServerUrl().replace(/^http/, 'ws'));
    PageConfig.setOption('token', getJupyterServerToken());
    PageConfig.setOption('collaborative', String(collaborative));
    PageConfig.setOption('disableRTC', String(!collaborative));
    PageConfig.setOption('terminalsAvailable', String(terminals));
  }
  // console.log('Created config for Jupyter React', config);
  return config;
};
