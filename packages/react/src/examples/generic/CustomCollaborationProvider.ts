/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';
import { 
  ICollaborationProviderImpl,
  ICollaborationOptions,
  collaborationProviderRegistry
} from '../../index';

/**
 * Example custom collaboration provider demonstrating how to extend
 * the generic collaboration system without any Datalayer dependencies.
 * 
 * This provider can be used with any WebSocket-based collaboration server.
 */
export class CustomCollaborationProvider implements ICollaborationProviderImpl {
  readonly name = 'custom-example';

  /**
   * Create a custom WebSocket provider for collaboration
   * @param options - Collaboration options containing ydoc, awareness, path, etc.
   * @returns Promise that resolves to a configured YWebsocketProvider
   */
  async createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const { ydoc, awareness, path, token } = options;

    if (!path) {
      throw new Error('Path is required for custom collaboration');
    }

    // Example: Connect to a custom collaboration server
    // You would replace this with your actual server configuration
    const wsUrl = options.wsUrl || 'ws://localhost:1234/collaboration';
    const roomName = `custom-room-${path.replace(/\//g, '-')}`;

    console.log(`Creating custom collaboration provider for room: ${roomName}`);

    // Create the WebSocket provider with custom configuration
    const provider = new YWebsocketProvider(
      wsUrl,
      roomName,
      ydoc,
      {
        awareness,
        params: {
          // Custom parameters for your collaboration server
          path,
          token: token || '',
          timestamp: Date.now().toString(),
          // Add any custom parameters your server needs
          customParam: 'example-value'
        },
        // Custom WebSocket options
        connect: true,
        // Disable broadcasting to other browser tabs (optional)
        disableBc: false,
        // Custom protocols (optional)
        protocols: [],
      }
    );

    // Optional: Add custom event handlers
    provider.on('status', (event: any) => {
      console.log(`Custom provider status: ${event.status}`);
    });

    provider.on('sync', (isSynced: boolean) => {
      console.log(`Custom provider synced: ${isSynced}`);
    });

    // Optional: Custom authentication or initialization
    await this.authenticate(token);
    
    return provider;
  }

  /**
   * Example authentication method
   * Replace with your actual authentication logic
   */
  private async authenticate(token?: string): Promise<void> {
    if (!token) {
      console.log('No token provided, using anonymous mode');
      return;
    }

    // Simulate authentication
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Custom provider authenticated');
        resolve();
      }, 100);
    });
  }
}

/**
 * Alternative simple collaboration provider for local development
 */
export class LocalCollaborationProvider implements ICollaborationProviderImpl {
  readonly name = 'local-dev';

  async createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const { ydoc, awareness, path } = options;

    // Use a local WebSocket server for development
    const provider = new YWebsocketProvider(
      'ws://localhost:1234',
      `local-${path}`,
      ydoc,
      {
        awareness,
        connect: false, // Don't connect automatically
      }
    );

    // For local development, we might not have a real server
    // So we can work in offline mode
    console.log('LocalCollaborationProvider created in offline mode');
    
    return provider;
  }
}

/**
 * Mock collaboration provider for testing
 */
export class MockCollaborationProvider implements ICollaborationProviderImpl {
  readonly name = 'mock';

  async createProvider(options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const { ydoc, awareness } = options;

    // Create a provider that doesn't actually connect anywhere
    const provider = new YWebsocketProvider(
      'ws://mock-server',
      'mock-room',
      ydoc,
      {
        awareness,
        connect: false, // Never actually connect
      }
    );

    // Simulate successful connection
    setTimeout(() => {
      (provider as any).wsconnected = true;
      provider.emit('status', [{ status: 'connected' }]);
    }, 500);

    return provider;
  }
}

/**
 * Register all custom providers when this module is imported
 * This demonstrates the auto-registration pattern
 */
export function registerCustomProviders(): void {
  console.log('Registering custom collaboration providers...');
  
  // Register the custom provider
  collaborationProviderRegistry.register('custom-example', new CustomCollaborationProvider());
  
  // Register the local development provider
  collaborationProviderRegistry.register('local-dev', new LocalCollaborationProvider());
  
  // Register the mock provider for testing
  collaborationProviderRegistry.register('mock', new MockCollaborationProvider());
  
  console.log('Custom providers registered:', collaborationProviderRegistry.getProviderNames());
}

// Auto-register on import (optional)
// Uncomment this line to auto-register when the module is imported
// registerCustomProviders();

export default CustomCollaborationProvider;