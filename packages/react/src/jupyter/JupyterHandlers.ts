import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import JupyterAuthError from './JupyterAuthError';

/**
 * Call the Jupyter server API.
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
export async function requestAPI<T>(
  serverSettings: ServerConnection.ISettings,
  namespace = '',
  endPoint = '',
  init: RequestInit = {}
): Promise<T> {
  // Make request to the Jupyter API.
  const requestUrl = URLExt.join(
    serverSettings.baseUrl,
    namespace,
    endPoint
  );
  let response: Response;
  try {
    response = await ServerConnection.makeRequest(requestUrl, init, serverSettings);
    if (response.status === 403) {
      throw new JupyterAuthError();
    }
  } catch (error) {
    throw new ServerConnection.NetworkError(error);
  }
  let data: any = await response.text();
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.warn('Not a JSON response body.', response);
    }
  }
  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }
  return data;
}
