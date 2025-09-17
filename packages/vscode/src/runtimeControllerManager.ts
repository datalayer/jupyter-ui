/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module runtimeControllerManager
 * @description Manages multiple NotebookController instances for Datalayer runtimes.
 * Creates dynamic controllers for existing runtimes and provides options to create new ones.
 * Handles controller lifecycle, real-time updates, and runtime status synchronization.
 */

import * as vscode from 'vscode';
import { AuthService } from './auth/authService';
import { SpacerApiService, RuntimeResponse } from './spaces/spacerApiService';
import { RuntimeController } from './runtimeController';

/**
 * Types of runtime controllers that can be created.
 */
export enum RuntimeControllerType {
  ExistingRuntime = 'existing',
  CreatePythonCpu = 'create-python-cpu',
  CreateAiEnv = 'create-ai-env'
}

/**
 * Configuration for creating a runtime controller.
 */
export interface RuntimeControllerConfig {
  type: RuntimeControllerType;
  runtime?: RuntimeResponse;
  environmentName?: string;
  displayName: string;
  description: string;
  detail: string;
}

/**
 * Manages multiple NotebookController instances for Datalayer runtimes.
 * Provides dynamic kernel options in VS Code's kernel picker based on available runtimes.
 *
 * @class RuntimeControllerManager
 * @implements {vscode.Disposable}
 */
export class RuntimeControllerManager implements vscode.Disposable {
  private readonly _context: vscode.ExtensionContext;
  private readonly _authService: AuthService;
  private readonly _spacerApiService: SpacerApiService;
  private readonly _controllers = new Map<string, RuntimeController>();
  private _refreshTimer: NodeJS.Timeout | undefined;
  private _disposed = false;

  /**
   * Creates a new RuntimeControllerManager instance.
   *
   * @constructor
   * @param {vscode.ExtensionContext} context - The extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._authService = AuthService.getInstance(context);
    this._spacerApiService = SpacerApiService.getInstance();

    console.log('[RuntimeControllerManager] Initializing runtime controller manager');
  }

  /**
   * Initializes the controller manager and creates initial controllers.
   * Sets up periodic refresh for runtime status updates.
   *
   * @public
   * @async
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    console.log('[RuntimeControllerManager] Starting initialization...');

    try {
      // Create initial controllers
      await this.refreshControllers();
      console.log('[RuntimeControllerManager] Initialization completed successfully');
    } catch (error) {
      console.error('[RuntimeControllerManager] Initialization failed:', error);
      throw error;
    }

    // Set up periodic refresh if enabled
    const refreshInterval = vscode.workspace.getConfiguration('datalayer.notebook').get<number>('refreshInterval', 30000);
    if (refreshInterval > 0) {
      this._refreshTimer = setInterval(() => {
        if (!this._disposed) {
          this.refreshControllers().catch(error => {
            console.error('[RuntimeControllerManager] Error during periodic refresh:', error);
          });
        }
      }, refreshInterval);
    }

    console.log('[RuntimeControllerManager] Initialized with refresh interval:', refreshInterval);
  }

  /**
   * Refreshes all controllers based on current runtime state.
   * Removes controllers for deleted runtimes and creates controllers for new ones.
   *
   * @public
   * @async
   * @returns {Promise<void>}
   */
  public async refreshControllers(): Promise<void> {
    if (this._disposed) {
      console.log('[RuntimeControllerManager] Manager is disposed, skipping refresh');
      return;
    }

    console.log('[RuntimeControllerManager] Starting controller refresh...');

    try {
      // Check if user is authenticated - if not, only show creation controllers
      const isAuthenticated = this._authService.getAuthState().isAuthenticated;
      console.log('[RuntimeControllerManager] Authentication status:', isAuthenticated);
      if (!isAuthenticated) {
        console.log('[RuntimeControllerManager] User not authenticated, showing only creation controllers');

        // For unauthenticated users, show creation controllers
        const creationConfigs = [
          {
            type: RuntimeControllerType.CreatePythonCpu,
            environmentName: 'python-cpu-env',
            displayName: 'Datalayer: Create Python CPU Runtime',
            description: 'Create a new Python CPU runtime with standard scientific libraries',
            detail: 'Python CPU environment with NumPy, Pandas, Matplotlib, etc.'
          },
          {
            type: RuntimeControllerType.CreateAiEnv,
            environmentName: 'ai-env',
            displayName: 'Datalayer: Create AI Runtime',
            description: 'Create a new AI runtime with machine learning frameworks',
            detail: 'AI environment with TensorFlow, PyTorch, Scikit-learn, etc.'
          }
        ];

        // Update controllers for unauthenticated state
        const currentControllerIds = new Set(this._controllers.keys());
        const desiredControllerIds = new Set(creationConfigs.map(config => this.getControllerId(config)));

        for (const controllerId of currentControllerIds) {
          if (!desiredControllerIds.has(controllerId)) {
            console.log('[RuntimeControllerManager] Removing controller:', controllerId);
            this.removeController(controllerId);
          }
        }

        for (const config of creationConfigs) {
          const controllerId = this.getControllerId(config);

          if (this._controllers.has(controllerId)) {
            const controller = this._controllers.get(controllerId)!;
            controller.updateConfig(config);
          } else {
            console.log('[RuntimeControllerManager] Creating creation controller:', controllerId);
            this.createController(config);
          }
        }

        console.log('[RuntimeControllerManager] Created controllers for unauthenticated user');
        return;
      }

      // Get current runtimes
      const runtimes = await this._spacerApiService.listRuntimes();
      console.log('[RuntimeControllerManager] Found runtimes:', runtimes.length);

      // Create configurations for all controllers we want
      const desiredConfigs = this.generateControllerConfigs(runtimes);

      // Remove controllers that are no longer needed
      const currentControllerIds = new Set(this._controllers.keys());
      const desiredControllerIds = new Set(desiredConfigs.map(config => this.getControllerId(config)));

      for (const controllerId of currentControllerIds) {
        if (!desiredControllerIds.has(controllerId)) {
          console.log('[RuntimeControllerManager] Removing controller:', controllerId);
          this.removeController(controllerId);
        }
      }

      // Create or update controllers
      for (const config of desiredConfigs) {
        const controllerId = this.getControllerId(config);

        if (this._controllers.has(controllerId)) {
          // Update existing controller
          const controller = this._controllers.get(controllerId)!;
          controller.updateConfig(config);
        } else {
          // Create new controller
          console.log('[RuntimeControllerManager] Creating controller:', controllerId);
          this.createController(config);
        }
      }

      console.log('[RuntimeControllerManager] Refresh complete, active controllers:', this._controllers.size);
    } catch (error) {
      console.error('[RuntimeControllerManager] Error refreshing controllers:', error);
    }
  }

  /**
   * Generates controller configurations based on available runtimes.
   * Creates configs for existing runtimes and runtime creation options.
   *
   * @private
   * @param {RuntimeResponse[]} runtimes - Available runtimes
   * @returns {RuntimeControllerConfig[]} Array of controller configurations
   */
  private generateControllerConfigs(runtimes: RuntimeResponse[]): RuntimeControllerConfig[] {
    const configs: RuntimeControllerConfig[] = [];
    const showDetails = vscode.workspace.getConfiguration('datalayer.notebook').get<boolean>('showRuntimeDetails', true);

    // Create controllers for existing runtimes
    for (const runtime of runtimes) {
      if (runtime.status === 'running' || runtime.status === 'ready') {
        const runtimeName = runtime.given_name || runtime.pod_name || runtime.uid;
        const environmentName = runtime.environment_name || runtime.environment_title || 'default';

        let displayName = `Datalayer: ${runtimeName}`;
        let detail = `Runtime: ${runtimeName}`;

        if (showDetails) {
          const creditsInfo = runtime.credits_limit && runtime.credits_used !== undefined
            ? ` (${runtime.credits_used}/${runtime.credits_limit} credits)`
            : '';

          displayName += ` (${environmentName}${creditsInfo})`;
          detail = `Environment: ${environmentName}, Status: ${runtime.status}${creditsInfo}`;
        }

        configs.push({
          type: RuntimeControllerType.ExistingRuntime,
          runtime,
          displayName,
          description: `Execute cells using existing Datalayer runtime: ${runtimeName}`,
          detail
        });
      }
    }

    // Create controllers for runtime creation
    configs.push({
      type: RuntimeControllerType.CreatePythonCpu,
      environmentName: 'python-cpu-env',
      displayName: 'Datalayer: Create Python CPU Runtime',
      description: 'Create a new Python CPU runtime with standard scientific libraries',
      detail: 'Python CPU environment with NumPy, Pandas, Matplotlib, etc.'
    });

    configs.push({
      type: RuntimeControllerType.CreateAiEnv,
      environmentName: 'ai-env',
      displayName: 'Datalayer: Create AI Runtime',
      description: 'Create a new AI runtime with machine learning frameworks',
      detail: 'AI environment with TensorFlow, PyTorch, Scikit-learn, etc.'
    });

    return configs;
  }

  /**
   * Creates a new RuntimeController with the given configuration.
   *
   * @private
   * @param {RuntimeControllerConfig} config - Controller configuration
   * @returns {void}
   */
  private createController(config: RuntimeControllerConfig): void {
    const controllerId = this.getControllerId(config);

    try {
      const controller = new RuntimeController(this._context, config, this._spacerApiService);
      this._controllers.set(controllerId, controller);

      console.log(`[RuntimeControllerManager] Created controller: ${controllerId}`);
    } catch (error) {
      console.error(`[RuntimeControllerManager] Failed to create controller ${controllerId}:`, error);
    }
  }

  /**
   * Removes a controller by ID and disposes of its resources.
   *
   * @private
   * @param {string} controllerId - ID of the controller to remove
   * @returns {void}
   */
  private removeController(controllerId: string): void {
    const controller = this._controllers.get(controllerId);
    if (controller) {
      controller.dispose();
      this._controllers.delete(controllerId);
      console.log(`[RuntimeControllerManager] Removed controller: ${controllerId}`);
    }
  }

  /**
   * Clears all controllers and disposes of their resources.
   *
   * @private
   * @returns {void}
   */
  private clearAllControllers(): void {
    console.log('[RuntimeControllerManager] Clearing all controllers');

    for (const [controllerId, controller] of this._controllers) {
      controller.dispose();
    }

    this._controllers.clear();
  }

  /**
   * Generates a unique controller ID from a configuration.
   *
   * @private
   * @param {RuntimeControllerConfig} config - Controller configuration
   * @returns {string} Unique controller ID
   */
  private getControllerId(config: RuntimeControllerConfig): string {
    switch (config.type) {
      case RuntimeControllerType.ExistingRuntime:
        return `datalayer-runtime-${config.runtime!.uid}`;
      case RuntimeControllerType.CreatePythonCpu:
        return 'datalayer-create-python-cpu';
      case RuntimeControllerType.CreateAiEnv:
        return 'datalayer-create-ai-env';
      default:
        throw new Error(`Unknown controller type: ${config.type}`);
    }
  }

  /**
   * Gets all active runtime controllers.
   * Used for debugging and status display.
   *
   * @public
   * @returns {RuntimeController[]} Array of active controllers
   */
  public getActiveControllers(): RuntimeController[] {
    return Array.from(this._controllers.values());
  }

  /**
   * Forces a manual refresh of all controllers.
   * Useful for external triggers like runtime lifecycle events.
   *
   * @public
   * @async
   * @returns {Promise<void>}
   */
  public async forceRefresh(): Promise<void> {
    console.log('[RuntimeControllerManager] Force refresh requested');
    await this.refreshControllers();
  }

  /**
   * Disposes of the controller manager and cleans up resources.
   * Called when the extension is deactivated.
   *
   * @public
   * @returns {void}
   */
  public dispose(): void {
    console.log('[RuntimeControllerManager] Disposing controller manager');

    this._disposed = true;

    // Clear refresh timer
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = undefined;
    }

    // Dispose all controllers
    this.clearAllControllers();

    console.log('[RuntimeControllerManager] Controller manager disposed');
  }
}