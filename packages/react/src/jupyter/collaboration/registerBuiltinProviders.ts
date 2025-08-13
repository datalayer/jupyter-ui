/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { collaborationProviderRegistry } from './CollaborationProviderRegistry';
import { JupyterCollaborationProvider } from './JupyterCollaborationProvider';

/**
 * Register built-in collaboration providers.
 * This should be called during application initialization.
 */
export function registerBuiltinCollaborationProviders(): void {
  // Register the built-in Jupyter collaboration provider
  collaborationProviderRegistry.register('jupyter', new JupyterCollaborationProvider());
}

// Auto-register built-in providers when this module is imported
registerBuiltinCollaborationProviders();