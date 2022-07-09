/**
 * Type of the Jupyter configuration.
 */
export type IJupyterConfig = {
  jupyterServerHttpUrl: string;
  jupyterServerWsUrl: string;
  jupyterToken: string;
}

/**
 * The default Jupyter configuration.
 */
let config: IJupyterConfig = {
  jupyterServerHttpUrl: '',
  jupyterServerWsUrl: '',
  jupyterToken: '',
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
export const loadJupyterConfig = () => {
  let config = Object.create({});
  const htmlConfig = document.getElementById('datalayer-config-data');
  if (htmlConfig) {
    config = JSON.parse(htmlConfig.textContent || '') as {
        [key: string]: string;
    }
    if (config['jupyterServerHttpUrl']) {
        setJupyterServerHttpUrl(config['jupyterServerHttpUrl']);
    }
    if (config['jupyterServerWsUrl']) {
        setJupyterServerWsUrl(config['jupyterServerWsUrl']);
    }
    if (config['jupyterToken']) {
        setJupyterToken(config['jupyterToken']);
    }
  }
}
