/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ICell, IOutput } from '@jupyterlab/nbformat';
import { ulid } from 'ulid';
import { UUID } from '@lumino/coreutils';

export const newUlid = () => {
  return ulid()
}

export const newUuid = () => {
  return UUID.uuid4();
}

export const cellSourceAsString = (cell: ICell) => {
  let source = cell.source;
  if (typeof source === 'object') {
    source = (source as []).join('\n');
  }
  return source;
}

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
}
