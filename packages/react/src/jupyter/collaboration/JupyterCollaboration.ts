/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { URLExt } from '@jupyterlab/coreutils';
import { Contents, ServerConnection } from '@jupyterlab/services';

export const COLLABORATION_ROOM_URL_PATH = 'api/collaboration/room';

export const COLLABORATION_SESSION_URL_PATH = 'api/collaboration/session';

/**
 * Document session model
 */
export interface ISessionModel {
  /**
   * Document format; 'text', 'base64',...
   */
  format: Contents.FileFormat;
  /**
   * Document type
   */
  type: Contents.ContentType;
  /**
   * File unique identifier
   */
  fileId: string;
  /**
   * Server session identifier
   */
  sessionId: string;
}

export async function requestDocSession(
  format: string,
  type: string,
  path: string
): Promise<ISessionModel> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(
    settings.baseUrl,
    COLLABORATION_SESSION_URL_PATH,
    encodeURIComponent(path)
  );
  const body = {
    method: 'PUT',
    body: JSON.stringify({ format, type })
  };
  let response: Response;
  try {
    response = await ServerConnection.makeRequest(url, body, settings);
  } catch (error) {
    throw new ServerConnection.NetworkError(error as Error);
  }
  let data: any = await response.text();
  if (data.length > 0) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log('Not a JSON response body.', response);
    }
  }
  if (!response.ok) {
    throw new ServerConnection.ResponseError(response, data.message || data);
  }
  return data;
}

export default {};
