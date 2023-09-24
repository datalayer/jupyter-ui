import { PageConfig } from '@jupyterlab/coreutils';
import { JupyterProps } from './Jupyter';

/**
 * Type of the Jupyter configuration.
 */
export type IJupyterConfig = {
  jupyterServerHttpUrl: string;
  jupyterServerWsUrl: string;
  jupyterToken: string;
  insideJupyterLab: boolean;
  insideJupyterHub: boolean;
}

/**
 * The default Jupyter configuration.
 */
let config: IJupyterConfig = {
  jupyterServerHttpUrl: '',
  jupyterServerWsUrl: '',
  jupyterToken: '',
  insideJupyterLab: false,
  insideJupyterHub: false,
}

/**
 * Setter for jupyterServerHttpUrl.
 */
export const setJupyterServerHttpUrl = (jupyterServerHttpUrl: string) => {
  config.jupyterServerHttpUrl = jupyterServerHttpUrl;
}
/**
 * Getter for jupyterServerHttpUrl.
 */
 export const getJupyterServerHttpUrl = () => config.jupyterServerHttpUrl;

/**
 * Setter for jupyterServerWsUrl.
 */
 export const setJupyterServerWsUrl = (jupyterServerWsUrl: string) => {
  config.jupyterServerWsUrl = jupyterServerWsUrl;
}
/**
 * Getter for jupyterServerWsUrl.
 */
 export const getJupyterServerWsUrl = () => config.jupyterServerWsUrl;

/**
 * Setter for jupyterToken.
 */
 export const setJupyterToken = (jupyterToken: string) => {
  config.jupyterToken = jupyterToken;
}
/**
 * Getter for jupyterToken.
 */
 export const getJupyterToken = () => config.jupyterToken;

/**
 * Method to load the Jupyter configuration from the
 * host HTML page.
 */
export const loadJupyterConfig = (props: JupyterProps) => {
  const { lite, jupyterServerHttpUrl, jupyterServerWsUrl, collaborative, terminals, jupyterToken } = props;
  const datalayerConfigData = document.getElementById('datalayer-config-data');
  if (datalayerConfigData) {
    config = JSON.parse(datalayerConfigData.textContent || '') as IJupyterConfig;
    setJupyterServerHttpUrl(config.jupyterServerHttpUrl ?? jupyterServerHttpUrl ?? location.protocol + '//' + location.host + "/api/jupyter");
    setJupyterServerWsUrl(config.jupyterServerWsUrl ?? jupyterServerWsUrl ?? location.protocol.replace('http', 'ws') + '//' + location.host + "/api/jupyter");
    setJupyterToken(config.jupyterToken ?? jupyterToken ?? '');
  }
  else {
    // No Datalayer Config.
    const jupyterConfigData = document.getElementById('jupyter-config-data');
    if (jupyterConfigData) {
      const jupyterConfig = JSON.parse(jupyterConfigData.textContent || '');
      setJupyterServerHttpUrl(location.protocol + '//' + location.host + jupyterConfig.baseUrl);
      setJupyterServerWsUrl(location.protocol === "https" ? "wss://" + location.host : "ws://" + location.host + jupyterConfig.baseUrl);
      setJupyterToken(jupyterConfig.token);
      config.insideJupyterLab = jupyterConfig.appName === 'JupyterLab';
    }
    else {
      // No Datalayer and no JupyterLab Config.
      config.jupyterServerHttpUrl = jupyterServerHttpUrl!;
      config.jupyterServerWsUrl = jupyterServerWsUrl!;
      config.jupyterToken = jupyterToken!;
      setJupyterServerHttpUrl(config.jupyterServerHttpUrl ?? location.protocol + '//' + location.host + "/api/jupyter");
      setJupyterServerWsUrl(config.jupyterServerWsUrl ?? location.protocol.replace('http', 'ws') + '//' + location.host + "/api/jupyter");
      setJupyterToken(config.jupyterToken ?? '');
      }
  }
  if (lite) {
    setJupyterServerHttpUrl(location.protocol + '//' + location.host);
    setJupyterServerWsUrl(location.protocol === "https" ? "wss://" + location.host : "ws://" + location.host);
  }
  PageConfig.setOption('baseUrl', getJupyterServerHttpUrl());
  PageConfig.setOption('wsUrl', getJupyterServerWsUrl());
  PageConfig.setOption('token', getJupyterToken());
  PageConfig.setOption('collaborative', String(collaborative || false));
  PageConfig.setOption('terminalsAvailable', String(terminals || false));
  PageConfig.setOption('mathjaxUrl', 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js');
  PageConfig.setOption('mathjaxConfig', 'TeX-AMS_CHTML-full,Safe');
//  PageConfig.getOption('hubHost')
//  PageConfig.getOption('hubPrefix')
//  PageConfig.getOption('hubUser')
//  PageConfig.getOption('hubServerName')
  config.insideJupyterHub = PageConfig.getOption('hubHost') !== "";
  return config;
}
