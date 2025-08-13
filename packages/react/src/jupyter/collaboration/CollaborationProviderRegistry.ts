/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { WebsocketProvider as YWebsocketProvider } from 'y-websocket';
import { ICollaborationProviderImpl, ICollaborationOptions } from './ICollaborationProvider';

/**
 * Registry for collaboration providers using the plugin pattern.
 * Allows different collaboration backends to register themselves
 * and be used by the Notebook component without hardcoded dependencies.
 */
export class CollaborationProviderRegistry {
  private static instance: CollaborationProviderRegistry;
  private providers: Map<string, ICollaborationProviderImpl> = new Map();

  private constructor() {}

  /**
   * Get the singleton instance of the registry
   */
  static getInstance(): CollaborationProviderRegistry {
    if (!CollaborationProviderRegistry.instance) {
      CollaborationProviderRegistry.instance = new CollaborationProviderRegistry();
    }
    return CollaborationProviderRegistry.instance;
  }

  /**
   * Register a collaboration provider
   * @param name - The name/type of the provider
   * @param provider - The provider instance
   */
  register(name: string, provider: ICollaborationProviderImpl): void {
    if (this.providers.has(name)) {
      console.warn(`Collaboration provider '${name}' is already registered. Overriding...`);
    }
    this.providers.set(name, provider);
    console.log(`Registered collaboration provider: ${name}`);
  }

  /**
   * Unregister a collaboration provider
   * @param name - The name/type of the provider to unregister
   */
  unregister(name: string): boolean {
    const result = this.providers.delete(name);
    if (result) {
      console.log(`Unregistered collaboration provider: ${name}`);
    }
    return result;
  }

  /**
   * Get a registered collaboration provider by name
   * @param name - The name/type of the provider
   * @returns The provider instance or undefined if not found
   */
  getProvider(name: string): ICollaborationProviderImpl | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all registered provider names
   * @returns Array of registered provider names
   */
  getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   * @param name - The name/type of the provider
   * @returns True if the provider is registered
   */
  hasProvider(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Create a websocket provider using the specified collaboration type
   * @param providerName - The name of the collaboration provider to use
   * @param options - Configuration options for the provider
   * @returns Promise that resolves to a configured YWebsocketProvider
   * @throws Error if the provider is not registered
   */
  async createProvider(providerName: string, options: ICollaborationOptions): Promise<YWebsocketProvider> {
    const provider = this.getProvider(providerName);
    if (!provider) {
      const available = this.getProviderNames();
      const builtIn = ['jupyter'];
      throw new Error(
        `Collaboration provider '${providerName}' is not registered.\n` +
        `Built-in providers: [${builtIn.join(', ')}]\n` +
        `Available providers: [${available.join(', ')}]\n` +
        `Register new providers via: collaborationProviderRegistry.register('${providerName}', provider)`
      );
    }
    return await provider.createProvider(options);
  }
}

/**
 * Global singleton instance of the collaboration provider registry
 */
export const collaborationProviderRegistry = CollaborationProviderRegistry.getInstance();