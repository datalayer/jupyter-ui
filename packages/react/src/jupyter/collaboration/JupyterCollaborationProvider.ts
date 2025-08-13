/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { URLExt } from '@jupyterlab/coreutils';
import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';
import { ICollaborationProviderImpl, ICollaborationOptions } from './ICollaborationProvider';
import { COLLABORATION_ROOM_URL_PATH, requestJupyterCollaborationSession } from './JupyterCollaboration';

/**
 * Collaboration provider for Jupyter Lab/Server based collaboration
 */
export class JupyterCollaborationProvider implements ICollaborationProviderImpl {
  readonly name = 'jupyter';

  /**
   * Create a Jupyter collaboration provider
   * @param options - Collaboration options
   * @returns Promise that resolves to a configured YWebsocketProvider
   */
  async createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const { ydoc, awareness, path, serviceManager, token } = options;

    if (!serviceManager) {
      throw new Error('ServiceManager is required for Jupyter collaboration');
    }

    if (!path) {
      throw new Error('Path is required for Jupyter collaboration');
    }

    // Request a collaboration session from the Jupyter server
    const session = await requestJupyterCollaborationSession('json', 'notebook', path);
    
    // Construct the websocket URL for the collaboration room
    const documentURL = URLExt.join(
      serviceManager.serverSettings.wsUrl!,
      COLLABORATION_ROOM_URL_PATH
    );
    
    // Create the document name for the collaboration session
    const documentName = `${session.format}:${session.type}:${session.fileId}`;
    
    // Create and configure the websocket provider
    const provider = new YWebsocketProvider(documentURL, documentName, ydoc, {
      disableBc: true,
      params: {
        sessionId: session.sessionId,
        token: token!,
      },
      awareness,
    });

    return provider;
  }
}