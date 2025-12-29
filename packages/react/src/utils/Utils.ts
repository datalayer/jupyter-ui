/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ICell, IOutput } from '@jupyterlab/nbformat';
import { ServerConnection } from '@jupyterlab/services';
import { UUID } from '@lumino/coreutils';
import { ulid } from 'ulid';
import { requestAPI } from '../jupyter';

export const newUlid = () => {
  return ulid();
};

export const newUuid = () => {
  return UUID.uuid4();
};

export const cellSourceAsString = (cell: ICell) => {
  let source = cell.source;
  if (typeof source === 'object') {
    source = (source as []).join('\n');
  }
  return source;
};

export const outputsAsString = (outputs: IOutput[]) => {
  let result = '';
  outputs.forEach(output => {
    switch (output.output_type) {
      case 'display_data': {
        if (output.text) {
          result = result + output.text + '\n';
        }
        break;
      }
      case 'update_display_data': {
        if (output.text) {
          result = result + output.text + '\n';
        }
        break;
      }
      case 'stream': {
        if (output.text) {
          result = result + output.text + '\n';
        }
        break;
      }
      case 'error': {
        if (output.text) {
          result = result + output.text + '\n';
        }
        break;
      }
      case 'execute_result': {
        if (output.data) {
          const display =
            (output.data as any)['text/html'] ??
            (output.data as any)['text/plain'] ??
            '';
          result = result + display + '\n';
        }
        break;
      }
      default: {
        console.warn(
          'Unknown output type while converting output to string',
          output
        );
      }
    }
  });
  return result;
};

export const getCookie = (name: string): string | null => {
  const nameLenPlus = name.length + 1;
  return (
    document.cookie
      .split(';')
      .map(c => c.trim())
      .filter(cookie => {
        return cookie.substring(0, nameLenPlus) === `${name}=`;
      })
      .map(cookie => {
        return decodeURIComponent(cookie.substring(nameLenPlus));
      })[0] || null
  );
};

/**
 * Promise resolving after a delay.
 *
 * @param ms Delay in milliseconds
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Utility method to ensure the Jupyter context
 * is authenticated with the Jupyter server.
 */
export const ensureJupyterAuth = async (
  serverSettings: ServerConnection.ISettings
): Promise<boolean> => {
  try {
    await requestAPI<any>(serverSettings, 'api', '');
    return true;
  } catch (reason) {
    console.log('The Jupyter Server API has failed with reason', reason);
    return false;
  }
};

/*
 *
 */
export const createServerSettings = (
  jupyterServerUrl: string,
  jupyterServerToken: string
) => {
  return ServerConnection.makeSettings({
    baseUrl: jupyterServerUrl,
    wsUrl: jupyterServerUrl.replace(/^http/, 'ws'),
    token: jupyterServerToken,
    appendToken: true,
    init: {
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store',
    },
  });
};