/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module runtimeController
 * Individual runtime controller wrapper for NotebookController instances.
 * Handles cell execution for specific Datalayer runtimes or runtime creation flows.
 * Provides WebSocket-based Jupyter protocol communication and output handling.
 */

import * as vscode from 'vscode';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from '../auth/authService';
import { SpacerApiService } from '../spaces/spacerApiService';
import { RuntimesApiService, RuntimeResponse } from './runtimesApiService';
import {
  RuntimeControllerConfig,
  RuntimeControllerType,
} from './runtimeControllerManager';

/**
 * Interface for notebook cell execution context.
 * Contains information needed to execute a cell against a Datalayer runtime.
 */
interface CellExecutionContext {
  cell: vscode.NotebookCell;
  token: vscode.CancellationToken;
  executionOrder?: number;
  execution: vscode.NotebookCellExecution;
}

/**
 * Interface for Jupyter kernel messages.
 * Based on the Jupyter messaging protocol specification.
 */
interface JupyterMessage {
  header: {
    msg_id: string;
    msg_type: string;
    username: string;
    session: string;
    date: string;
    version: string;
  };
  parent_header?: any;
  metadata?: any;
  content: any;
  buffers?: any[];
}

/**
 * Interface for kernel connection information.
 * Contains WebSocket and session details for Jupyter kernel communication.
 */
interface KernelConnection {
  websocket: WebSocket;
  sessionId: string;
  kernelId: string;
}

/**
 * Individual runtime controller that wraps a VS Code NotebookController.
 * Handles cell execution for a specific runtime or runtime creation flow.
 *
 * @class RuntimeController

 */
export class RuntimeController implements vscode.Disposable {
  private readonly _context: vscode.ExtensionContext;
  private readonly _controller: vscode.NotebookController;
  private readonly _spacerApiService: SpacerApiService;
  private readonly _runtimesApiService: RuntimesApiService;
  private readonly _authService: AuthService;
  private _config: RuntimeControllerConfig;
  private _activeRuntime: RuntimeResponse | undefined;
  private _kernelConnection: KernelConnection | undefined;
  private _executionOrder = 0;
  private _pendingExecutions = new Map<string, CellExecutionContext>();

  /**
   * Creates a new RuntimeController instance.
   *
   * @param {vscode.ExtensionContext} context - The extension context
   * @param {RuntimeControllerConfig} config - Controller configuration
   * @param {SpacerApiService} spacerApiService - Spacer API service instance
   */
  constructor(
    context: vscode.ExtensionContext,
    config: RuntimeControllerConfig,
    spacerApiService: SpacerApiService,
  ) {
    this._context = context;
    this._config = config;
    this._spacerApiService = spacerApiService;
    this._runtimesApiService = RuntimesApiService.getInstance(context);
    this._authService = AuthService.getInstance(context);

    // Set initial runtime if provided
    if (config.runtime) {
      this._activeRuntime = config.runtime;
    }

    // Create the notebook controller
    this._controller = vscode.notebooks.createNotebookController(
      this.getControllerId(),
      'jupyter-notebook',
      config.displayName,
    );

    // Configure controller properties
    this._controller.description = config.description;
    this._controller.detail = config.detail;
    this._controller.supportedLanguages = ['python'];
    this._controller.supportsExecutionOrder = true;

    // Set execution handler
    this._controller.executeHandler = this._executeHandler.bind(this);

    // For selector controllers, handle selection immediately
    if (config.type !== RuntimeControllerType.ExistingRuntime) {
      // When this controller is selected, immediately show the runtime picker
      this._controller.onDidChangeSelectedNotebooks(async e => {
        if (e.selected && e.notebook) {
          console.log(
            '[RuntimeController] Selector controller selected, showing runtime picker',
          );
          // Show the runtime selector when the controller is selected
          await this._showRuntimeSelectorForNotebook(e.notebook);
        }
      });
    }

    // Add to context subscriptions for cleanup
    context.subscriptions.push(this._controller);
    context.subscriptions.push(this);

    console.log(
      `[RuntimeController] Controller created: ${this.getControllerId()}`,
    );
  }

  /**
   * Updates the controller configuration and refreshes display properties.
   *
   * @public
   * @param {RuntimeControllerConfig} config - New configuration
   * @returns {void}
   */
  public updateConfig(config: RuntimeControllerConfig): void {
    this._config = config;

    // Update controller properties
    this._controller.label = config.displayName;
    this._controller.description = config.description;
    this._controller.detail = config.detail;

    // Update runtime if provided
    if (config.runtime) {
      this._activeRuntime = config.runtime;
    }

    console.log(
      `[RuntimeController] Updated config for: ${this.getControllerId()}`,
    );
  }

  /**
   * Gets the controller ID based on the configuration.
   *
   * @private
   * @returns {string} Controller ID
   */
  private getControllerId(): string {
    switch (this._config.type) {
      case RuntimeControllerType.ExistingRuntime:
        return `datalayer-runtime-${this._config.runtime!.uid}`;
      case RuntimeControllerType.CreatePythonCpu:
        return 'datalayer-create-python-cpu';
      case RuntimeControllerType.CreateAiEnv:
        return 'datalayer-create-ai-env';
      default:
        throw new Error(`Unknown controller type: ${this._config.type}`);
    }
  }

  /**
   * Gets the current authentication status.
   *
   * @private
   * @returns {boolean} True if user is authenticated with Datalayer
   */
  private get isAuthenticated(): boolean {
    return this._authService.getAuthState().isAuthenticated;
  }

  /**
   * Handles notebook cell execution requests.
   * This is the main entry point when users execute cells with this controller.
   *
   * @private

   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @param {vscode.NotebookDocument} _notebook - The notebook document (unused)
   * @param {vscode.NotebookController} _controller - The controller instance (unused)
   * @returns {Promise<void>}
   */
  private async _executeHandler(
    cells: vscode.NotebookCell[],
    _notebook: vscode.NotebookDocument,
    _controller: vscode.NotebookController,
  ): Promise<void> {
    console.log(
      `[RuntimeController] Executing cells: ${cells.length} (${this.getControllerId()})`,
    );

    // Check authentication first
    if (!this.isAuthenticated) {
      await this._handleUnauthenticatedExecution(cells);
      return;
    }

    // Handle runtime selector or creation
    if (this._config.type !== RuntimeControllerType.ExistingRuntime) {
      // If we already have an active runtime from a previous selection, use it
      if (this._activeRuntime) {
        console.log(
          '[RuntimeController] Using previously selected runtime:',
          this._activeRuntime.pod_name,
        );
        // Execute with the existing runtime
        for (const cell of cells) {
          const execution = this._controller.createNotebookCellExecution(cell);
          execution.executionOrder = ++this._executionOrder;
          execution.start(Date.now());

          try {
            await this._executeCell({
              cell,
              token: execution.token,
              executionOrder: execution.executionOrder,
              execution,
            });

            execution.end(true, Date.now());
          } catch (error) {
            console.error('[RuntimeController] Cell execution failed:', error);

            execution.replaceOutput([
              new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(error as Error),
              ]),
            ]);

            execution.end(false, Date.now());
          }
        }
        return;
      }

      // Show runtime picker for first-time selection or creation
      console.log('[RuntimeController] Showing runtime selector');
      await this._showRuntimeSelector(cells);
      return;
    }

    // Execute each cell sequentially
    for (const cell of cells) {
      const execution = this._controller.createNotebookCellExecution(cell);
      execution.executionOrder = ++this._executionOrder;
      execution.start(Date.now());

      try {
        await this._executeCell({
          cell,
          token: execution.token,
          executionOrder: execution.executionOrder,
          execution,
        });

        execution.end(true, Date.now());
      } catch (error) {
        console.error('[RuntimeController] Cell execution failed:', error);

        // Add error output to cell
        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(error as Error),
          ]),
        ]);

        execution.end(false, Date.now());
      }
    }
  }

  /**
   * Handles execution when user is not authenticated.
   * Prompts for login and provides helpful error messages.
   *
   * @private

   * @param {vscode.NotebookCell[]} cells - Array of cells that failed to execute
   * @returns {Promise<void>}
   */
  private async _handleUnauthenticatedExecution(
    cells: vscode.NotebookCell[],
  ): Promise<void> {
    const loginAction = 'Login to Datalayer';
    const selection = await vscode.window.showErrorMessage(
      'You must be logged in to execute cells with Datalayer Runtime.',
      loginAction,
    );

    if (selection === loginAction) {
      await vscode.commands.executeCommand('datalayer.login');
      return;
    }

    // Mark all cells as failed with authentication error
    for (const cell of cells) {
      const execution = this._controller.createNotebookCellExecution(cell);
      execution.start(Date.now());

      execution.replaceOutput([
        new vscode.NotebookCellOutput([
          vscode.NotebookCellOutputItem.error(
            new Error(
              'Authentication required: Please login to Datalayer to execute cells.',
            ),
          ),
        ]),
      ]);

      execution.end(false, Date.now());
    }
  }

  /**
   * Shows runtime selector for notebook without executing cells.
   * Used when the selector controller is selected from kernel picker.
   *
   * @private

   * @param {vscode.NotebookDocument} notebook - The notebook document
   * @returns {Promise<void>}
   */
  private async _showRuntimeSelectorForNotebook(
    notebook: vscode.NotebookDocument,
  ): Promise<void> {
    try {
      console.log('[RuntimeController] Showing runtime selector for notebook');

      // Check authentication
      const authState = this._authService.getAuthState();
      if (!authState.isAuthenticated) {
        const loginAction = 'Login to Datalayer';
        const selection = await vscode.window.showErrorMessage(
          'You must be logged in to select or create Datalayer runtimes.',
          loginAction,
        );

        if (selection === loginAction) {
          await vscode.commands.executeCommand('datalayer.login');
        }
        return;
      }

      // Fetch available runtimes
      const runtimes = await this._runtimesApiService.listRuntimes();

      // Create picker options
      interface RuntimePickerItem extends vscode.QuickPickItem {
        type: 'existing' | 'create';
        runtime?: RuntimeResponse;
        environmentName?: string;
      }

      const pickerItems: RuntimePickerItem[] = [];

      // Add existing runtimes
      for (const runtime of runtimes) {
        if (
          runtime.status === 'running' ||
          runtime.status === 'ready' ||
          (!runtime.status && runtime.ingress && runtime.token)
        ) {
          const runtimeName =
            runtime.given_name || runtime.pod_name || runtime.uid;
          const environmentName =
            runtime.environment_name || runtime.environment_title || 'default';

          pickerItems.push({
            label: `$(server) ${runtimeName}`,
            description: environmentName,
            detail: `Use existing runtime (${runtime.status || 'active'})`,
            type: 'existing',
            runtime,
          });
        }
      }

      // Add separator if there are existing runtimes
      if (pickerItems.length > 0) {
        pickerItems.push({
          label: '',
          kind: vscode.QuickPickItemKind.Separator,
          type: 'existing',
        } as any);
      }

      // Add creation options
      pickerItems.push({
        label: '$(add) Create Python CPU Runtime',
        description: 'python-cpu-env',
        detail:
          'Create a new Python CPU runtime with standard scientific libraries',
        type: 'create',
        environmentName: 'python-cpu-env',
      });

      pickerItems.push({
        label: '$(add) Create AI Runtime',
        description: 'ai-env',
        detail: 'Create a new AI runtime with machine learning frameworks',
        type: 'create',
        environmentName: 'ai-env',
      });

      // Show picker
      const selected = await vscode.window.showQuickPick(pickerItems, {
        title: 'Select or Create Datalayer Runtime',
        placeHolder: 'Choose an existing runtime or create a new one',
      });

      if (!selected) {
        return; // User cancelled
      }

      if (selected.type === 'existing') {
        // Use existing runtime
        this._activeRuntime = selected.runtime!;
        console.log(
          '[RuntimeController] Selected existing runtime:',
          this._activeRuntime.pod_name,
        );

        // Update the controller label to show the selected runtime
        const runtimeName =
          this._activeRuntime.given_name ||
          this._activeRuntime.pod_name ||
          this._activeRuntime.uid;
        this._controller.label = `Datalayer: ${runtimeName}`;
        this._controller.description = `Using runtime: ${runtimeName}`;

        // Associate this controller with the notebook
        this._controller.updateNotebookAffinity(
          notebook,
          vscode.NotebookControllerAffinity.Default,
        );

        vscode.window.showInformationMessage(
          `Selected runtime: ${runtimeName}`,
        );

        // Trigger a refresh to show the selected runtime in the picker
        console.log(
          '[RuntimeController] Triggering controller manager refresh after runtime selection',
        );
        vscode.commands.executeCommand('datalayer.refreshRuntimeControllers');
      } else {
        // Create new runtime
        const creditsLimit = vscode.workspace
          .getConfiguration('datalayer.runtime')
          .get<number>('creditsLimit', 10);

        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Creating ${selected.environmentName} runtime...`,
            cancellable: false,
          },
          async progress => {
            try {
              // Generate a unique name for the runtime
              const shortId = Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase();
              const envDisplayName =
                selected.environmentName === 'python-cpu-env'
                  ? 'Python CPU Env'
                  : 'AI Env';
              const generatedName = `VSCode Runtime ${shortId}`;

              const runtime = await this._runtimesApiService.createRuntime(
                creditsLimit,
                'notebook',
                generatedName,
                selected.environmentName!,
              );

              if (!runtime) {
                throw new Error('Failed to create runtime');
              }

              this._activeRuntime = runtime;

              // Update the controller label to show the created runtime
              const displayName =
                runtime.given_name || runtime.pod_name || runtime.uid;
              this._controller.label = `Datalayer: ${displayName}`;
              this._controller.description = `Using runtime: ${displayName}`;

              // Associate this controller with the notebook
              this._controller.updateNotebookAffinity(
                notebook,
                vscode.NotebookControllerAffinity.Default,
              );

              vscode.window.showInformationMessage(
                `Successfully created runtime: ${displayName}`,
              );

              // Trigger a refresh of the controller manager to create a proper controller for this runtime
              console.log(
                '[RuntimeController] Triggering controller manager refresh after runtime creation',
              );
              vscode.commands.executeCommand(
                'datalayer.refreshRuntimeControllers',
              );
            } catch (error) {
              vscode.window.showErrorMessage(
                `Failed to create runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
              );
            }
          },
        );
      }
    } catch (error) {
      console.error('[RuntimeController] Runtime selection failed:', error);
      vscode.window.showErrorMessage(
        `Failed to select runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Shows runtime selector with existing runtimes and creation options.
   * Allows users to choose an existing runtime or create a new one.
   *
   * @private

   * @param {vscode.NotebookCell[]} cells - Array of cells to execute after selection
   * @returns {Promise<void>}
   */
  private async _showRuntimeSelector(
    cells: vscode.NotebookCell[],
  ): Promise<void> {
    try {
      // Extensive debugging start
      console.log('='.repeat(80));
      console.log('[RuntimeController] KERNEL SELECTION DEBUG SESSION START');
      console.log('[RuntimeController] Controller config:', {
        type: this._config.type,
        displayName: this._config.displayName,
        environmentName: this._config.environmentName,
        runtime: this._config.runtime
          ? {
              uid: this._config.runtime.uid,
              pod_name: this._config.runtime.pod_name,
              status: this._config.runtime.status,
            }
          : null,
      });

      // Check authentication status
      const authState = this._authService.getAuthState();
      console.log('[RuntimeController] Authentication status:', {
        isAuthenticated: authState.isAuthenticated,
        hasToken: !!this._authService.getToken(),
        serverUrl: this._authService.getServerUrl(),
      });

      if (!authState.isAuthenticated) {
        console.log(
          '[RuntimeController] ERROR: User not authenticated, cannot fetch runtimes',
        );
        throw new Error('Please login to Datalayer to access runtimes');
      }

      // Fetch available runtimes
      console.log(
        '[RuntimeController] Fetching available runtimes from API...',
      );
      const startTime = Date.now();
      const runtimes = await this._runtimesApiService.listRuntimes();
      const fetchTime = Date.now() - startTime;

      console.log('[RuntimeController] API call completed in', fetchTime, 'ms');
      console.log('[RuntimeController] API Response Summary:', {
        totalRuntimes: runtimes.length,
        responseTime: `${fetchTime}ms`,
        hasRuntimes: runtimes.length > 0,
      });
      console.log(
        '[RuntimeController] Full API response:',
        JSON.stringify(runtimes, null, 2),
      );

      // Create picker options
      interface RuntimePickerItem extends vscode.QuickPickItem {
        type: 'existing' | 'create';
        runtime?: RuntimeResponse;
        environmentName?: string;
      }

      const pickerItems: RuntimePickerItem[] = [];

      // Runtime categorization
      const runningRuntimes: RuntimeResponse[] = [];
      const readyRuntimes: RuntimeResponse[] = [];
      const otherRuntimes: RuntimeResponse[] = [];

      // Add existing runtimes
      console.log('[RuntimeController] ANALYZING RUNTIMES');
      console.log('[RuntimeController] Total runtimes found:', runtimes.length);

      for (let i = 0; i < runtimes.length; i++) {
        const runtime = runtimes[i];
        console.log(
          `[RuntimeController] Runtime ${i + 1}/${runtimes.length}:`,
          {
            uid: runtime.uid,
            status: runtime.status,
            pod_name: runtime.pod_name,
            given_name: runtime.given_name,
            environment_name: runtime.environment_name,
            environment_title: runtime.environment_title,
            credits_limit: runtime.credits_limit,
            credits_used: runtime.credits_used,
            ingress: runtime.ingress ? 'present' : 'missing',
            token: runtime.token ? 'present' : 'missing',
          },
        );

        // Categorize runtime by status
        if (runtime.status === 'running') {
          runningRuntimes.push(runtime);
          console.log(
            `[RuntimeController] Runtime ${i + 1} is RUNNING - will be added to picker`,
          );
        } else if (runtime.status === 'ready') {
          readyRuntimes.push(runtime);
          console.log(
            `[RuntimeController] Runtime ${i + 1} is READY - will be added to picker`,
          );
        } else {
          otherRuntimes.push(runtime);
          console.log(
            `[RuntimeController] Runtime ${i + 1} has status '${runtime.status}' - will be skipped`,
          );
        }

        // Only add running/ready runtimes to picker
        if (runtime.status === 'running' || runtime.status === 'ready') {
          const runtimeName =
            runtime.given_name || runtime.pod_name || runtime.uid;
          const environmentName =
            runtime.environment_name || runtime.environment_title || 'default';

          let creditsInfo = '';
          if (runtime.credits_limit && runtime.credits_used !== undefined) {
            creditsInfo = ` (${runtime.credits_used}/${runtime.credits_limit} credits)`;
          }

          const pickerItem = {
            label: `$(server) ${runtimeName}`,
            description: `${environmentName}${creditsInfo}`,
            detail: `Status: ${runtime.status} • Ready to use`,
            type: 'existing' as const,
            runtime,
          };

          console.log(`[RuntimeController] Adding runtime to picker:`, {
            label: pickerItem.label,
            description: pickerItem.description,
            detail: pickerItem.detail,
          });

          pickerItems.push(pickerItem);
        } else {
          console.log(
            '[RuntimeController] Skipping runtime due to status:',
            runtime.status,
          );
        }
      }

      // Runtime analysis summary
      console.log('[RuntimeController] RUNTIME ANALYSIS SUMMARY:', {
        totalRuntimes: runtimes.length,
        runningRuntimes: runningRuntimes.length,
        readyRuntimes: readyRuntimes.length,
        otherRuntimes: otherRuntimes.length,
        pickerItemsFromRuntimes: pickerItems.length,
      });

      console.log(
        '[RuntimeController] Running runtimes:',
        runningRuntimes.map(r => ({
          name: r.given_name || r.pod_name,
          environment: r.environment_name,
          status: r.status,
        })),
      );

      console.log(
        '[RuntimeController] Ready runtimes:',
        readyRuntimes.map(r => ({
          name: r.given_name || r.pod_name,
          environment: r.environment_name,
          status: r.status,
        })),
      );

      // Add creation options
      const createPythonOption = {
        label: '$(add) Create Python CPU Runtime',
        description: 'Standard scientific libraries',
        detail: 'NumPy, Pandas, Matplotlib, Scikit-learn, etc.',
        type: 'create' as const,
        environmentName: 'python-cpu-env',
      };

      const createAiOption = {
        label: '$(add) Create AI Runtime',
        description: 'Machine learning frameworks',
        detail: 'TensorFlow, PyTorch, Transformers, etc.',
        type: 'create' as const,
        environmentName: 'ai-env',
      };

      pickerItems.push(createPythonOption, createAiOption);

      console.log('[RuntimeController] Added creation options to picker');
      console.log(
        '[RuntimeController] Final picker items count:',
        pickerItems.length,
      );
      console.log(
        '[RuntimeController] All picker items:',
        pickerItems.map(item => ({
          label: item.label,
          description: item.description,
          type: item.type,
        })),
      );

      // Show picker
      console.log('[RuntimeController] Displaying runtime picker to user...');
      const selected = await vscode.window.showQuickPick(pickerItems, {
        placeHolder: 'Select a Datalayer runtime or create a new one',
        title: 'Datalayer Runtime Selection',
      });

      console.log(
        '[RuntimeController] User selection result:',
        selected
          ? {
              label: selected.label,
              type: selected.type,
              hasRuntime: !!selected.runtime,
            }
          : 'No selection (cancelled)',
      );

      if (!selected) {
        // User cancelled - mark cells as cancelled
        for (const cell of cells) {
          const execution = this._controller.createNotebookCellExecution(cell);
          execution.start(Date.now());
          execution.end(false, Date.now());
        }
        return;
      }

      if (selected.type === 'existing') {
        // Use existing runtime
        this._activeRuntime = selected.runtime!;
        console.log(
          '[RuntimeController] Selected existing runtime:',
          this._activeRuntime.pod_name,
        );

        // Update controller label to show selected runtime
        const runtimeName =
          this._activeRuntime.given_name ||
          this._activeRuntime.pod_name ||
          this._activeRuntime.uid;
        this._controller.label = `Datalayer: ${runtimeName}`;
        this._controller.description = `Using runtime: ${runtimeName}`;

        // IMPORTANT: First trigger a refresh to ensure a proper controller exists for this runtime
        // This needs to happen BEFORE we try to execute cells
        console.log(
          '[RuntimeController] Triggering controller manager refresh for selected runtime:',
          this._activeRuntime.uid,
        );
        const existingController = await vscode.commands.executeCommand<any>(
          'datalayer.refreshRuntimeControllers',
          this._activeRuntime.uid,
        );

        // If we got a specific runtime controller back, use it to execute the cells
        // Otherwise fall back to executing with this selector controller
        if (
          existingController &&
          typeof existingController._executeCellsWithRuntime === 'function'
        ) {
          console.log(
            '[RuntimeController] Using existing runtime controller to execute cells',
          );
          await existingController._executeCellsWithRuntime(cells);
        } else {
          console.log(
            '[RuntimeController] No specific controller returned, executing with selector controller',
          );
          await this._executeCellsWithRuntime(cells);
        }
      } else {
        // Create new runtime
        const createdRuntimeUid = await this._createAndExecuteRuntime(
          selected.environmentName!,
          cells,
        );

        // Wait a bit for the runtime to be fully initialized and show up in the API
        console.log(
          '[RuntimeController] Waiting 3 seconds for runtime to be fully initialized...',
        );
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Force a refresh of the controller manager to ensure we have the latest runtimes
        console.log(
          '[RuntimeController] Refreshing controller manager to get latest runtimes...',
        );
        await vscode.commands.executeCommand(
          'datalayer.refreshRuntimeControllers',
        );

        // After creating the runtime, show the picker again so user can select the newly created runtime
        console.log(
          '[RuntimeController] Showing runtime picker again after creation to select the new runtime',
        );
        await this._showRuntimeSelector(cells);
      }

      console.log(
        '[RuntimeController] KERNEL SELECTION DEBUG SESSION END - SUCCESS',
      );
      console.log('='.repeat(80));
    } catch (error) {
      console.error('[RuntimeController] Runtime selection failed:', error);
      console.log(
        '[RuntimeController] KERNEL SELECTION DEBUG SESSION END - ERROR',
      );
      console.log('='.repeat(80));

      // Mark all cells as failed
      for (const cell of cells) {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.start(Date.now());

        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(
              new Error(
                `Failed to fetch runtimes: ${error instanceof Error ? error.message : 'Unknown error'}`,
              ),
            ),
          ]),
        ]);

        execution.end(false, Date.now());
      }

      vscode.window.showErrorMessage(
        `Failed to fetch runtimes: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Executes cells with the currently active runtime.
   *
   * @public

   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @returns {Promise<void>}
   */
  public async _executeCellsWithRuntime(
    cells: vscode.NotebookCell[],
  ): Promise<void> {
    for (const cell of cells) {
      const execution = this._controller.createNotebookCellExecution(cell);
      execution.executionOrder = ++this._executionOrder;
      execution.start(Date.now());

      try {
        await this._executeCell({
          cell,
          token: execution.token,
          executionOrder: execution.executionOrder,
          execution,
        });

        execution.end(true, Date.now());
      } catch (error) {
        console.error('[RuntimeController] Cell execution failed:', error);

        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(error as Error),
          ]),
        ]);

        execution.end(false, Date.now());
      }
    }
  }

  /**
   * Creates a new runtime and executes cells with it.
   *
   * @private

   * @param {string} environmentName - Environment name for the new runtime
   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @returns {Promise<string | undefined>} The UID of the created runtime
   */
  private async _createAndExecuteRuntime(
    environmentName: string,
    cells: vscode.NotebookCell[],
  ): Promise<string | undefined> {
    const creditsLimit = vscode.workspace
      .getConfiguration('datalayer.runtime')
      .get<number>('creditsLimit', 10);

    // Show progress while creating runtime - IMPORTANT: We must return the promise from withProgress
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Creating ${environmentName} runtime...`,
        cancellable: false,
      },
      async progress => {
        progress.report({
          increment: 0,
          message: 'Requesting new runtime...',
        });

        try {
          // Generate a unique name for the runtime
          const shortId = Math.random()
            .toString(36)
            .substring(2, 8)
            .toUpperCase();
          const envDisplayName =
            environmentName === 'python-cpu-env' ? 'Python CPU Env' : 'AI Env';
          const generatedName = `VSCode Runtime - ${shortId}`;

          console.log('[RuntimeController] Creating runtime with parameters:', {
            creditsLimit,
            type: 'notebook',
            givenName: generatedName,
            environmentName,
          });

          // Create the runtime
          const runtime = await this._runtimesApiService.createRuntime(
            creditsLimit,
            'notebook',
            generatedName,
            environmentName,
          );

          if (!runtime) {
            throw new Error('Failed to create runtime');
          }

          progress.report({
            increment: 50,
            message: 'Runtime created, waiting for initialization...',
          });

          // Store the created runtime
          this._activeRuntime = runtime;

          // Update controller label to show created runtime
          const displayName =
            runtime.given_name || runtime.pod_name || runtime.uid;
          this._controller.label = `Datalayer: ${displayName}`;
          this._controller.description = `Using runtime: ${displayName}`;

          // Associate with notebook if we have one
          const notebook =
            cells.length > 0
              ? cells[0].notebook
              : vscode.window.activeNotebookEditor?.notebook;
          if (notebook) {
            this._controller.updateNotebookAffinity(
              notebook,
              vscode.NotebookControllerAffinity.Preferred,
            );
          }

          progress.report({
            increment: 80,
            message: 'Runtime ready, refreshing available runtimes...',
          });

          // Trigger a refresh of the controller manager to create a proper controller for this runtime
          console.log(
            '[RuntimeController] Triggering controller manager refresh after runtime creation with UID:',
            runtime.uid,
          );
          await vscode.commands.executeCommand(
            'datalayer.refreshRuntimeControllers',
            runtime.uid,
          );

          progress.report({ increment: 100, message: 'Done!' });

          // Show success message with runtime info
          vscode.window.showInformationMessage(
            `Successfully created ${environmentName} runtime: ${displayName}`,
          );

          // Return the runtime UID so the caller can use it
          return runtime.uid;
        } catch (error) {
          console.error('[RuntimeController] Runtime creation failed:', error);

          // Mark all cells as failed
          for (const cell of cells) {
            const execution =
              this._controller.createNotebookCellExecution(cell);
            execution.start(Date.now());

            execution.replaceOutput([
              new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(
                  new Error(
                    `Failed to create runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
                  ),
                ),
              ]),
            ]);

            execution.end(false, Date.now());
          }

          vscode.window.showErrorMessage(
            `Failed to create ${environmentName} runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );

          return undefined;
        }
      },
    );
  }

  /**
   * Executes a single notebook cell against the active runtime.
   * Handles WebSocket communication and output capture.
   *
   * @private

   * @param {CellExecutionContext} context - Cell execution context
   * @returns {Promise<void>}
   */
  private async _executeCell(context: CellExecutionContext): Promise<void> {
    const { cell, token, execution } = context;

    // Check for cancellation
    if (token.isCancellationRequested) {
      return;
    }

    // Ensure we have an active runtime and kernel connection
    await this._ensureRuntime();
    await this._ensureKernelConnection();

    if (!this._activeRuntime || !this._kernelConnection) {
      throw new Error('Failed to create or connect to Datalayer runtime');
    }

    // Get cell source code
    const sourceCode = cell.document.getText();
    if (!sourceCode.trim()) {
      return; // Skip empty cells
    }

    console.log(
      '[RuntimeController] Executing code:',
      sourceCode.substring(0, 100),
    );

    // Create execute request message
    const msgId = uuidv4();
    const executeMessage: JupyterMessage = {
      header: {
        msg_id: msgId,
        msg_type: 'execute_request',
        username: 'datalayer-vscode',
        session: this._kernelConnection.sessionId,
        date: new Date().toISOString(),
        version: '5.3',
      },
      parent_header: {},
      metadata: {},
      content: {
        code: sourceCode,
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false,
        stop_on_error: true,
      },
    };

    // Store the execution context for handling responses
    this._pendingExecutions.set(msgId, context);

    // Send the execution request
    this._kernelConnection.websocket.send(JSON.stringify(executeMessage));

    console.log('[RuntimeController] Sent execute request:', msgId);

    // Wait for execution to complete
    await new Promise<void>(resolve => {
      const checkInterval = setInterval(() => {
        // Check if we received execute_reply (execution is done)
        if (!this._pendingExecutions.has(msgId)) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 30 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        this._pendingExecutions.delete(msgId);
        resolve();
      }, 30000);
    });
  }

  /**
   * Ensures an active Datalayer runtime is available for execution.
   * Verifies existing runtime or uses the configured runtime.
   *
   * @private

   * @returns {Promise<void>}
   */
  private async _ensureRuntime(): Promise<void> {
    if (this._activeRuntime?.pod_name) {
      // Verify the runtime is still active
      try {
        console.log(
          '[RuntimeController] Verifying runtime health:',
          this._activeRuntime.pod_name,
        );
        const currentRuntime = await this._runtimesApiService.getRuntime(
          this._activeRuntime.pod_name,
        );

        if (currentRuntime) {
          // Check if runtime is in a usable state
          const isRunning =
            currentRuntime.status === 'running' ||
            currentRuntime.status === 'ready';
          const hasConnection = currentRuntime.ingress && currentRuntime.token;

          if (isRunning && hasConnection) {
            console.log(
              '[RuntimeController] Runtime is healthy, updating token/ingress',
            );
            this._activeRuntime = currentRuntime;
            return;
          } else if (
            currentRuntime.status === 'stopped' ||
            currentRuntime.status === 'expired'
          ) {
            console.log(
              '[RuntimeController] Runtime is stopped/expired:',
              currentRuntime.status,
            );

            // Store the runtime name before resetting
            const runtimeName = this._activeRuntime.pod_name;

            // Reset the controller state
            this._activeRuntime = undefined;
            this._kernelConnection = undefined;

            // Reset controller label to show runtime is unavailable
            this._controller.label = 'Datalayer Runtimes...';
            this._controller.description =
              'Runtime no longer available - select a new one';

            // Show error to user
            const createNew = 'Create New Runtime';
            const selectExisting = 'Select Existing Runtime';
            const selection = await vscode.window.showErrorMessage(
              `Runtime ${runtimeName} is ${currentRuntime.status}. Please select or create a new runtime.`,
              createNew,
              selectExisting,
            );

            if (selection === createNew || selection === selectExisting) {
              // Show the runtime selector
              const notebook = vscode.window.activeNotebookEditor?.notebook;
              if (notebook) {
                await this._showRuntimeSelectorForNotebook(notebook);
                // After selection, retry the verification
                if (this._activeRuntime) {
                  return await this._ensureRuntime();
                }
              }
            }

            throw new Error(
              `Runtime is ${currentRuntime.status}. Please select or create a new runtime.`,
            );
          } else {
            console.log(
              '[RuntimeController] Runtime status uncertain, attempting to use:',
              currentRuntime.status,
            );
            // Try to use it anyway if it has connection info
            if (hasConnection) {
              this._activeRuntime = currentRuntime;
              return;
            }
          }
        } else {
          console.log('[RuntimeController] Runtime not found on server');
          // Runtime doesn't exist anymore
          this._activeRuntime = undefined;
          this._kernelConnection = undefined;

          // Reset controller label
          this._controller.label = 'Datalayer Runtimes...';
          this._controller.description = 'Runtime not found - select a new one';

          throw new Error(
            'Runtime no longer exists. Please select or create a new runtime.',
          );
        }
      } catch (error) {
        console.error(
          '[RuntimeController] Runtime verification failed:',
          error,
        );

        // Reset state on error
        this._activeRuntime = undefined;
        this._kernelConnection = undefined;

        throw new Error(
          `Failed to verify runtime: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Check if we have an active runtime (either from existing controller or recently created)
    if (this._activeRuntime) {
      return; // We have a runtime, good to go
    }

    // No runtime available at all
    throw new Error(
      'Runtime not available for execution. Please select or create a runtime.',
    );
  }

  /**
   * Ensures a WebSocket connection to the Jupyter kernel is established.
   * Creates a new connection if needed or reuses an existing one.
   *
   * @private

   * @returns {Promise<void>}
   */
  private async _ensureKernelConnection(): Promise<void> {
    if (
      this._kernelConnection &&
      this._kernelConnection.websocket.readyState === WebSocket.OPEN
    ) {
      console.log('[RuntimeController] WebSocket connection is active');
      return; // Connection is already active
    }

    // If connection exists but is not open, clean it up
    if (this._kernelConnection) {
      console.log('[RuntimeController] Cleaning up stale WebSocket connection');
      try {
        this._kernelConnection.websocket.close();
      } catch (error) {
        // Ignore close errors
      }
      this._kernelConnection = undefined;
    }

    if (!this._activeRuntime) {
      throw new Error('No active runtime available for kernel connection');
    }

    console.log('[RuntimeController] Establishing kernel connection...');
    console.log(
      '[RuntimeController] Runtime ingress:',
      this._activeRuntime.ingress,
    );

    try {
      // Create WebSocket connection to the kernel
      if (!this._activeRuntime.ingress) {
        throw new Error('Runtime ingress URL is not available');
      }

      // First, create a kernel session via REST API
      const baseUrl = this._activeRuntime.ingress;

      console.log(
        '[RuntimeController] Creating kernel session at:',
        `${baseUrl}/api/sessions`,
      );

      // Create a new kernel session
      const sessionResponse = await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this._activeRuntime.token}`,
        },
        body: JSON.stringify({
          path: 'vscode-notebook.ipynb', // Required field for Jupyter session
          name: 'VSCode Notebook',
          type: 'notebook',
          kernel: {
            name: 'python3',
          },
        }),
      });

      if (!sessionResponse.ok) {
        const errorText = await sessionResponse.text();
        throw new Error(
          `Failed to create kernel session: ${sessionResponse.status} ${errorText}`,
        );
      }

      const sessionData = (await sessionResponse.json()) as any;
      const kernelId = sessionData.kernel?.id;
      const sessionId = sessionData.id || uuidv4(); // Use the actual session ID from response

      if (!kernelId) {
        throw new Error('No kernel ID returned from session creation');
      }

      console.log('[RuntimeController] Created kernel session:', {
        session_id: sessionId,
        kernel_id: kernelId,
        kernel_name: sessionData.kernel?.name,
      });

      // Now connect to the kernel WebSocket
      const wsUrl = `${baseUrl.replace('https', 'wss')}/api/kernels/${kernelId}/channels`;
      console.log('[RuntimeController] Connecting to WebSocket:', wsUrl);

      const websocket = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Bearer ${this._activeRuntime.token}`,
        },
      });

      // Set up WebSocket event handlers
      websocket.on('open', () => {
        console.log('[RuntimeController] WebSocket connection established');
      });

      websocket.on('message', (data: Buffer) => {
        this._handleKernelMessage(data);
      });

      websocket.on('error', (error: Error) => {
        console.error('[RuntimeController] WebSocket error:', error);
      });

      websocket.on('close', () => {
        console.log('[RuntimeController] WebSocket connection closed');
        this._kernelConnection = undefined;
      });

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        websocket.once('open', resolve);
        websocket.once('error', reject);
      });

      this._kernelConnection = {
        websocket,
        sessionId,
        kernelId,
      };

      console.log('[RuntimeController] Kernel connection ready');
    } catch (error) {
      console.error(
        '[RuntimeController] Failed to establish kernel connection:',
        error,
      );
      throw new Error(`Failed to connect to kernel: ${error}`);
    }
  }

  /**
   * Handles incoming messages from the Jupyter kernel WebSocket.
   * Processes execution results and updates notebook cell outputs.
   *
   * @private
   * @param {Buffer} data - Raw message data from WebSocket
   * @returns {void}
   */
  private _handleKernelMessage(data: Buffer): void {
    try {
      const message: JupyterMessage = JSON.parse(data.toString());
      const parentMsgId = message.parent_header?.msg_id;

      console.log('[RuntimeController] Received kernel message:', {
        msg_type: message.header.msg_type,
        parent_msg_id: parentMsgId,
        has_content: !!message.content,
        content_keys: message.content ? Object.keys(message.content) : [],
      });

      if (!parentMsgId || !this._pendingExecutions.has(parentMsgId)) {
        console.log(
          '[RuntimeController] Message not related to pending execution, skipping',
        );
        return; // Not related to our execution
      }

      const context = this._pendingExecutions.get(parentMsgId)!;
      const { execution } = context;

      switch (message.header.msg_type) {
        case 'execute_reply':
          // Execution completed - mark as done
          console.log(
            '[RuntimeController] Execute reply received, execution status:',
            message.content.status,
          );
          // Small delay to allow any pending output messages to be processed
          setTimeout(() => {
            this._pendingExecutions.delete(parentMsgId);
          }, 100);
          break;

        case 'stream': {
          // Standard output/error
          const streamOutput = new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(
              message.content.text,
              message.content.name === 'stderr'
                ? 'text/x-stderr'
                : 'text/plain',
            ),
          ]);
          execution.appendOutput([streamOutput]);
          break;
        }

        case 'display_data':
        case 'execute_result': {
          // Rich output (HTML, images, etc.)
          const outputItems: vscode.NotebookCellOutputItem[] = [];

          for (const [mimeType, data] of Object.entries(
            message.content.data || {},
          )) {
            if (typeof data === 'string') {
              outputItems.push(
                vscode.NotebookCellOutputItem.text(data, mimeType),
              );
            } else {
              outputItems.push(
                vscode.NotebookCellOutputItem.json(data, mimeType),
              );
            }
          }

          if (outputItems.length > 0) {
            execution.appendOutput([
              new vscode.NotebookCellOutput(outputItems),
            ]);
          }
          break;
        }

        case 'error': {
          // Execution error
          const error = new Error(message.content.evalue || 'Execution error');
          execution.appendOutput([
            new vscode.NotebookCellOutput([
              vscode.NotebookCellOutputItem.error(error),
            ]),
          ]);
          this._pendingExecutions.delete(parentMsgId);
          break;
        }
      }
    } catch (error) {
      console.error(
        '[RuntimeController] Error handling kernel message:',
        error,
      );
    }
  }

  /**
   * Gets the VS Code notebook controller instance.
   *
   * @public
   * @returns {vscode.NotebookController} The VS Code notebook controller
   */
  public get controller(): vscode.NotebookController {
    return this._controller;
  }

  /**
   * Gets the current runtime configuration.
   *
   * @public
   * @returns {RuntimeControllerConfig} Current configuration
   */
  public get config(): RuntimeControllerConfig {
    return this._config;
  }

  /**
   * Gets the current active runtime information.
   *
   * @public
   * @returns {RuntimeResponse | undefined} Current runtime or undefined
   */
  public get activeRuntime(): RuntimeResponse | undefined {
    return this._activeRuntime;
  }

  /**
   * Disposes of the runtime controller and cleans up resources.
   * Called when the controller is no longer needed.
   *
   * @public
   * @returns {void}
   */
  public dispose(): void {
    // Close WebSocket connection if active
    if (this._kernelConnection?.websocket) {
      this._kernelConnection.websocket.close();
      this._kernelConnection = undefined;
    }

    // Clear pending executions
    this._pendingExecutions.clear();

    // Dispose the controller
    this._controller.dispose();
    console.log(
      `[RuntimeController] Controller disposed: ${this.getControllerId()}`,
    );
  }
}
