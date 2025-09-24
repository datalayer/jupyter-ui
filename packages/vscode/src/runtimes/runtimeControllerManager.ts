/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module runtimeControllerManager
 * Manages multiple NotebookController instances for Datalayer runtimes.
 * Creates dynamic controllers for existing runtimes and provides options to create new ones.
 * Handles controller lifecycle, real-time updates, and runtime status synchronization.
 */

import * as vscode from 'vscode';
import { AuthService } from '../auth/authService';
import { SpacerApiService } from '../spaces/spacerApiService';
import { RuntimesApiService, RuntimeResponse } from './runtimesApiService';
import { RuntimeController } from './runtimeController';

/**
 * Types of runtime controllers that can be created.
 * @enum {string}
 */
export enum RuntimeControllerType {
  /** Controller for an existing runtime */
  ExistingRuntime = 'existing',
  /** Controller for creating a Python CPU runtime */
  CreatePythonCpu = 'create-python-cpu',
  /** Controller for creating an AI environment runtime */
  CreateAiEnv = 'create-ai-env',
}

/**
 * Configuration for creating a runtime controller.
 * @interface RuntimeControllerConfig
 */
export interface RuntimeControllerConfig {
  /** Type of controller to create */
  type: RuntimeControllerType;
  /** Existing runtime information (for ExistingRuntime type) */
  runtime?: RuntimeResponse;
  /** Environment name for new runtimes */
  environmentName?: string;
  /** Display name shown in VS Code UI */
  displayName: string;
  /** Description of the controller's purpose */
  description: string;
  /** Additional detail information */
  detail: string;
}

/**
 * Manages multiple NotebookController instances for Datalayer runtimes.
 * Provides dynamic kernel options in VS Code's kernel picker based on available runtimes.
 *
 * @class RuntimeControllerManager

 */
export class RuntimeControllerManager implements vscode.Disposable {
  private readonly _context: vscode.ExtensionContext;
  private readonly _authService: AuthService;
  private readonly _spacerApiService: SpacerApiService;
  private readonly _runtimesApiService: RuntimesApiService;
  private readonly _controllers = new Map<string, RuntimeController>();
  private _refreshTimer: NodeJS.Timeout | undefined;
  private _disposed = false;

  /**
   * Creates a new RuntimeControllerManager instance.
   *
   * @param {vscode.ExtensionContext} context - The extension context
   */
  constructor(context: vscode.ExtensionContext) {
    this._context = context;
    this._authService = AuthService.getInstance(context);
    this._spacerApiService = SpacerApiService.getInstance();
    this._runtimesApiService = RuntimesApiService.getInstance(context);

    console.log(
      '[RuntimeControllerManager] Initializing runtime controller manager',
    );
  }

  /**
   * Initializes the controller manager and creates initial controllers.
   * Sets up periodic refresh for runtime status updates.
   *
   * @public

   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    console.log('[RuntimeControllerManager] Starting initialization...');

    try {
      // Create initial controllers
      await this.refreshControllers();
      console.log(
        '[RuntimeControllerManager] Initialization completed successfully',
      );
    } catch (error) {
      console.error('[RuntimeControllerManager] Initialization failed:', error);
      throw error;
    }

    // Set up periodic refresh if enabled (default 10 seconds for more responsive updates)
    const refreshInterval = vscode.workspace
      .getConfiguration('datalayer.notebook')
      .get<number>('refreshInterval', 10000);
    if (refreshInterval > 0) {
      this._refreshTimer = setInterval(() => {
        if (!this._disposed) {
          this.refreshControllers().catch(error => {
            console.error(
              '[RuntimeControllerManager] Error during periodic refresh:',
              error,
            );
          });
        }
      }, refreshInterval);
    }

    console.log(
      '[RuntimeControllerManager] Initialized with refresh interval:',
      refreshInterval,
    );
  }

  /**
   * Refreshes all controllers based on current runtime state.
   * Removes controllers for deleted runtimes and creates controllers for new ones.
   *
   * @public

   * @returns {Promise<void>}
   */
  public async refreshControllers(): Promise<void> {
    if (this._disposed) {
      console.log(
        '[RuntimeControllerManager] Manager is disposed, skipping refresh',
      );
      return;
    }

    console.log('[RuntimeControllerManager] Starting controller refresh...');

    // IMPORTANT: Always clear all existing controllers first to avoid stale data
    console.log(
      '[RuntimeControllerManager] Clearing existing controllers to ensure fresh state',
    );
    this.clearAllControllers();

    try {
      // Check if user is authenticated - if not, only show creation controllers
      const isAuthenticated = this._authService.getAuthState().isAuthenticated;
      console.log(
        '[RuntimeControllerManager] Authentication status:',
        isAuthenticated,
      );
      if (!isAuthenticated) {
        console.log(
          '[RuntimeControllerManager] User not authenticated, showing only creation controllers',
        );

        // For unauthenticated users, show a single selector controller
        const creationConfigs = [
          {
            type: RuntimeControllerType.CreatePythonCpu, // Use as a placeholder for selector
            environmentName: 'selector',
            displayName: 'Datalayer Runtimes...',
            description: 'Login to select or create a Datalayer runtime',
            detail: 'Authentication required to access runtimes',
          },
        ];

        // Create the selector controller for unauthenticated users
        for (const config of creationConfigs) {
          const controllerId = this.getControllerId(config);
          console.log(
            '[RuntimeControllerManager] Creating selector controller:',
            controllerId,
          );
          this.createController(config);
        }

        console.log(
          '[RuntimeControllerManager] Created controllers for unauthenticated user',
        );
        return;
      }

      // Get current runtimes
      console.log(
        '[RuntimeControllerManager] ========== FETCHING RUNTIMES ==========',
      );
      const startTime = Date.now();
      const runtimes = await this._runtimesApiService.listRuntimes();
      const fetchTime = Date.now() - startTime;

      console.log(
        '[RuntimeControllerManager] API call completed in',
        fetchTime,
        'ms',
      );
      console.log(
        '[RuntimeControllerManager] Found runtimes:',
        runtimes.length,
      );
      console.log(
        '[RuntimeControllerManager] Raw runtimes response:',
        JSON.stringify(runtimes, null, 2),
      );

      // Create configurations for all controllers we want
      const desiredConfigs = this.generateControllerConfigs(runtimes);

      // Create fresh controllers for each runtime
      for (const config of desiredConfigs) {
        const controllerId = this.getControllerId(config);
        console.log(
          '[RuntimeControllerManager] Creating controller:',
          controllerId,
        );
        this.createController(config);
      }

      console.log(
        '[RuntimeControllerManager] Refresh complete, active controllers:',
        this._controllers.size,
      );
    } catch (error) {
      console.error(
        '[RuntimeControllerManager] Error refreshing controllers:',
        error,
      );
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
  private generateControllerConfigs(
    runtimes: RuntimeResponse[],
  ): RuntimeControllerConfig[] {
    console.log(
      '[RuntimeControllerManager] ========== GENERATING CONTROLLER CONFIGS ==========',
    );
    console.log(
      '[RuntimeControllerManager] Processing',
      runtimes.length,
      'runtimes',
    );

    const configs: RuntimeControllerConfig[] = [];
    const showDetails = vscode.workspace
      .getConfiguration('datalayer.notebook')
      .get<boolean>('showRuntimeDetails', true);

    let validRuntimeCount = 0;
    let skippedRuntimeCount = 0;

    // Create controllers for existing runtimes
    for (let i = 0; i < runtimes.length; i++) {
      const runtime = runtimes[i];
      console.log(
        `[RuntimeControllerManager] Processing runtime ${i + 1}/${runtimes.length}:`,
        {
          uid: runtime.uid,
          given_name: runtime.given_name,
          pod_name: runtime.pod_name,
          status: runtime.status,
          environment_name: runtime.environment_name,
        },
      );

      // Accept runtimes that are running, ready, or have missing status but have ingress/token
      const hasValidStatus =
        runtime.status === 'running' || runtime.status === 'ready';
      const hasConnection = runtime.ingress && runtime.token;
      const isUsable = hasValidStatus || (!runtime.status && hasConnection);

      if (isUsable) {
        validRuntimeCount++;
        const reason = hasValidStatus
          ? `status: ${runtime.status}`
          : 'has ingress/token despite missing status';
        console.log(
          `[RuntimeControllerManager] Runtime ${i + 1} is valid (${reason}) - creating controller`,
        );
        const runtimeName =
          runtime.given_name || runtime.pod_name || runtime.uid;
        const environmentName =
          runtime.environment_name || runtime.environment_title || 'default';

        let displayName = `Datalayer: ${runtimeName}`;
        let detail = `Runtime: ${runtimeName}`;

        if (showDetails) {
          const creditsInfo =
            runtime.credits_limit && runtime.credits_used !== undefined
              ? ` (${runtime.credits_used}/${runtime.credits_limit} credits)`
              : '';

          displayName += ` (${environmentName}${creditsInfo})`;
          detail = `Environment: ${environmentName}, Status: ${runtime.status}${creditsInfo}`;
        }

        const config = {
          type: RuntimeControllerType.ExistingRuntime,
          runtime,
          displayName,
          description: `Execute cells using existing Datalayer runtime: ${runtimeName}`,
          detail,
        };

        console.log(
          `[RuntimeControllerManager] Adding runtime controller config:`,
          {
            displayName: config.displayName,
            description: config.description,
            runtime_status: runtime.status,
          },
        );

        configs.push(config);
      } else {
        skippedRuntimeCount++;
        console.log(
          `[RuntimeControllerManager] Runtime ${i + 1} skipped - status: ${runtime.status}, hasIngress: ${!!runtime.ingress}, hasToken: ${!!runtime.token}`,
        );
      }
    }

    console.log('[RuntimeControllerManager] Runtime processing summary:', {
      totalRuntimes: runtimes.length,
      validRuntimes: validRuntimeCount,
      skippedRuntimes: skippedRuntimeCount,
      configsFromRuntimes: configs.length,
    });

    // Don't create controllers for runtime creation - they will be handled by the runtime selector
    // Only add a single selector controller if there are no existing runtimes
    if (configs.length === 0) {
      configs.push({
        type: RuntimeControllerType.CreatePythonCpu, // Use as a placeholder for selector
        environmentName: 'selector',
        displayName: 'Datalayer Runtimes...',
        description: 'Select or create a Datalayer runtime',
        detail: 'Choose from existing runtimes or create a new one',
      });
    }

    console.log('[RuntimeControllerManager] Final controller config summary:', {
      totalConfigs: configs.length,
      runtimeConfigs: validRuntimeCount,
      createConfigs: 2,
    });
    console.log(
      '[RuntimeControllerManager] ========== CONTROLLER CONFIG GENERATION COMPLETE ==========',
    );

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
      const controller = new RuntimeController(
        this._context,
        config,
        this._spacerApiService,
      );
      this._controllers.set(controllerId, controller);

      console.log(
        `[RuntimeControllerManager] Created controller: ${controllerId}`,
      );

      // If this is a runtime controller (not selector) and we have an active notebook,
      // automatically select it if it matches the currently executing runtime
      if (
        config.type === RuntimeControllerType.ExistingRuntime &&
        vscode.window.activeNotebookEditor
      ) {
        const notebook = vscode.window.activeNotebookEditor.notebook;
        // Set affinity to Preferred to make it the default choice
        controller.controller.updateNotebookAffinity(
          notebook,
          vscode.NotebookControllerAffinity.Preferred,
        );
        console.log(
          `[RuntimeControllerManager] Set preferred affinity for controller: ${controllerId}`,
        );
      }
    } catch (error) {
      console.error(
        `[RuntimeControllerManager] Failed to create controller ${controllerId}:`,
        error,
      );
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
      console.log(
        `[RuntimeControllerManager] Removed controller: ${controllerId}`,
      );
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

   * @param {string} [selectRuntimeUid] - Optional UID of runtime to select after refresh
   * @returns {Promise<RuntimeController | undefined>} The selected controller if found
   */
  public async forceRefresh(
    selectRuntimeUid?: string,
  ): Promise<RuntimeController | undefined> {
    console.log(
      '[RuntimeControllerManager] Force refresh requested',
      selectRuntimeUid ? `(select: ${selectRuntimeUid})` : '',
    );
    await this.refreshControllers();

    // If a specific runtime UID was provided, find its controller and select it
    if (selectRuntimeUid) {
      const controllerId = `datalayer-runtime-${selectRuntimeUid}`;
      const controller = this._controllers.get(controllerId);

      if (controller && vscode.window.activeNotebookEditor) {
        const notebook = vscode.window.activeNotebookEditor.notebook;

        // Select this controller for the notebook
        controller.controller.updateNotebookAffinity(
          notebook,
          vscode.NotebookControllerAffinity.Preferred,
        );

        console.log(
          `[RuntimeControllerManager] Selected controller ${controllerId} for active notebook`,
        );

        // Return the controller so caller can use it
        return controller;
      }
    }

    return undefined;
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
