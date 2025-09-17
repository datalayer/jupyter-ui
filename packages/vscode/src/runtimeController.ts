/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module runtimeController
 * @description Individual runtime controller wrapper for NotebookController instances.
 * Handles cell execution for specific Datalayer runtimes or runtime creation flows.
 * Provides WebSocket-based Jupyter protocol communication and output handling.
 */

import * as vscode from 'vscode';
import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { AuthService } from './auth/authService';
import { SpacerApiService, RuntimeResponse } from './spaces/spacerApiService';
import { RuntimeControllerConfig, RuntimeControllerType } from './runtimeControllerManager';

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
 * @implements {vscode.Disposable}
 */
export class RuntimeController implements vscode.Disposable {
  private readonly _context: vscode.ExtensionContext;
  private readonly _controller: vscode.NotebookController;
  private readonly _spacerApiService: SpacerApiService;
  private readonly _authService: AuthService;
  private _config: RuntimeControllerConfig;
  private _activeRuntime: RuntimeResponse | undefined;
  private _kernelConnection: KernelConnection | undefined;
  private _executionOrder = 0;
  private _pendingExecutions = new Map<string, CellExecutionContext>();

  /**
   * Creates a new RuntimeController instance.
   *
   * @constructor
   * @param {vscode.ExtensionContext} context - The extension context
   * @param {RuntimeControllerConfig} config - Controller configuration
   * @param {SpacerApiService} spacerApiService - Spacer API service instance
   */
  constructor(
    context: vscode.ExtensionContext,
    config: RuntimeControllerConfig,
    spacerApiService: SpacerApiService
  ) {
    this._context = context;
    this._config = config;
    this._spacerApiService = spacerApiService;
    this._authService = AuthService.getInstance(context);

    // Set initial runtime if provided
    if (config.runtime) {
      this._activeRuntime = config.runtime;
    }

    // Create the notebook controller
    this._controller = vscode.notebooks.createNotebookController(
      this.getControllerId(),
      'jupyter-notebook',
      config.displayName
    );

    // Configure controller properties
    this._controller.description = config.description;
    this._controller.detail = config.detail;
    this._controller.supportedLanguages = ['python'];
    this._controller.supportsExecutionOrder = true;

    // Set execution handler
    this._controller.executeHandler = this._executeHandler.bind(this);

    // Add to context subscriptions for cleanup
    context.subscriptions.push(this._controller);
    context.subscriptions.push(this);

    console.log(`[RuntimeController] Controller created: ${this.getControllerId()}`);
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

    console.log(`[RuntimeController] Updated config for: ${this.getControllerId()}`);
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
   * @async
   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @param {vscode.NotebookDocument} _notebook - The notebook document (unused)
   * @param {vscode.NotebookController} _controller - The controller instance (unused)
   * @returns {Promise<void>}
   */
  private async _executeHandler(
    cells: vscode.NotebookCell[],
    _notebook: vscode.NotebookDocument,
    _controller: vscode.NotebookController
  ): Promise<void> {
    console.log(`[RuntimeController] Executing cells: ${cells.length} (${this.getControllerId()})`);

    // Check authentication first
    if (!this.isAuthenticated) {
      await this._handleUnauthenticatedExecution(cells);
      return;
    }

    // Handle runtime creation if needed
    if (this._config.type !== RuntimeControllerType.ExistingRuntime) {
      await this._handleRuntimeCreation(cells);
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
            vscode.NotebookCellOutputItem.error(error as Error)
          ])
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
   * @async
   * @param {vscode.NotebookCell[]} cells - Array of cells that failed to execute
   * @returns {Promise<void>}
   */
  private async _handleUnauthenticatedExecution(
    cells: vscode.NotebookCell[]
  ): Promise<void> {
    const loginAction = 'Login to Datalayer';
    const selection = await vscode.window.showErrorMessage(
      'You must be logged in to execute cells with Datalayer Runtime.',
      loginAction
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
            new Error('Authentication required: Please login to Datalayer to execute cells.')
          )
        ])
      ]);

      execution.end(false, Date.now());
    }
  }

  /**
   * Handles runtime creation for creation-type controllers.
   * Shows dynamic picker with existing runtimes + creation options.
   *
   * @private
   * @async
   * @param {vscode.NotebookCell[]} cells - Array of cells to execute after selection
   * @returns {Promise<void>}
   */
  private async _handleRuntimeCreation(cells: vscode.NotebookCell[]): Promise<void> {
    try {
      // Fetch available runtimes
      console.log('[RuntimeController] Fetching available runtimes...');
      const runtimes = await this._spacerApiService.listRuntimes();
      console.log('[RuntimeController] Raw runtimes response:', JSON.stringify(runtimes, null, 2));

      // Create picker options
      interface RuntimePickerItem extends vscode.QuickPickItem {
        type: 'existing' | 'create';
        runtime?: RuntimeResponse;
        environmentName?: string;
      }

      const pickerItems: RuntimePickerItem[] = [];

      // Add existing runtimes
      console.log('[RuntimeController] Processing runtimes, total found:', runtimes.length);
      for (const runtime of runtimes) {
        console.log('[RuntimeController] Processing runtime:', {
          uid: runtime.uid,
          status: runtime.status,
          pod_name: runtime.pod_name,
          given_name: runtime.given_name,
          environment_name: runtime.environment_name,
          environment_title: runtime.environment_title
        });

        if (runtime.status === 'running' || runtime.status === 'ready') {
          const runtimeName = runtime.given_name || runtime.pod_name || runtime.uid;
          const environmentName = runtime.environment_name || runtime.environment_title || 'default';

          let creditsInfo = '';
          if (runtime.credits_limit && runtime.credits_used !== undefined) {
            creditsInfo = ` (${runtime.credits_used}/${runtime.credits_limit} credits)`;
          }

          console.log('[RuntimeController] Adding runtime to picker:', runtimeName);

          pickerItems.push({
            label: `$(server) ${runtimeName}`,
            description: `${environmentName}${creditsInfo}`,
            detail: `Status: ${runtime.status} • Ready to use`,
            type: 'existing',
            runtime
          });
        } else {
          console.log('[RuntimeController] Skipping runtime due to status:', runtime.status);
        }
      }

      // Add creation options
      pickerItems.push(
        {
          label: '$(add) Create Python CPU Runtime',
          description: 'Standard scientific libraries',
          detail: 'NumPy, Pandas, Matplotlib, Scikit-learn, etc.',
          type: 'create',
          environmentName: 'python-cpu-env'
        },
        {
          label: '$(add) Create AI Runtime',
          description: 'Machine learning frameworks',
          detail: 'TensorFlow, PyTorch, Transformers, etc.',
          type: 'create',
          environmentName: 'ai-env'
        }
      );

      // Show picker
      const selected = await vscode.window.showQuickPick(pickerItems, {
        placeHolder: 'Select a Datalayer runtime or create a new one',
        title: 'Datalayer Runtime Selection'
      });

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
        console.log('[RuntimeController] Selected existing runtime:', this._activeRuntime.pod_name);

        // Execute cells with existing runtime
        await this._executeCellsWithRuntime(cells);

      } else {
        // Create new runtime
        await this._createAndExecuteRuntime(selected.environmentName!, cells);
      }

    } catch (error) {
      console.error('[RuntimeController] Runtime selection failed:', error);

      // Mark all cells as failed
      for (const cell of cells) {
        const execution = this._controller.createNotebookCellExecution(cell);
        execution.start(Date.now());

        execution.replaceOutput([
          new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.error(
              new Error(`Failed to fetch runtimes: ${error instanceof Error ? error.message : 'Unknown error'}`)
            )
          ])
        ]);

        execution.end(false, Date.now());
      }

      vscode.window.showErrorMessage(
        `Failed to fetch runtimes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Executes cells with the currently active runtime.
   *
   * @private
   * @async
   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @returns {Promise<void>}
   */
  private async _executeCellsWithRuntime(cells: vscode.NotebookCell[]): Promise<void> {
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
            vscode.NotebookCellOutputItem.error(error as Error)
          ])
        ]);

        execution.end(false, Date.now());
      }
    }
  }

  /**
   * Creates a new runtime and executes cells with it.
   *
   * @private
   * @async
   * @param {string} environmentName - Environment name for the new runtime
   * @param {vscode.NotebookCell[]} cells - Array of cells to execute
   * @returns {Promise<void>}
   */
  private async _createAndExecuteRuntime(environmentName: string, cells: vscode.NotebookCell[]): Promise<void> {
    const creditsLimit = vscode.workspace.getConfiguration('datalayer.runtime').get<number>('creditsLimit', 10);

    // Show progress while creating runtime
    await vscode.window.withProgress(
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
          // Create the runtime
          const runtime = await this._spacerApiService.createRuntime(
            creditsLimit,
            'notebook',
            undefined,
            environmentName
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

          progress.report({
            increment: 80,
            message: 'Runtime ready, executing cells...',
          });

          // Execute the cells with the new runtime
          await this._executeCellsWithRuntime(cells);

          progress.report({ increment: 100, message: 'Done!' });

          // Show success message with runtime info
          vscode.window.showInformationMessage(
            `Successfully created ${environmentName} runtime: ${runtime.pod_name || runtime.uid}`
          );

        } catch (error) {
          console.error('[RuntimeController] Runtime creation failed:', error);

          // Mark all cells as failed
          for (const cell of cells) {
            const execution = this._controller.createNotebookCellExecution(cell);
            execution.start(Date.now());

            execution.replaceOutput([
              new vscode.NotebookCellOutput([
                vscode.NotebookCellOutputItem.error(
                  new Error(`Failed to create runtime: ${error instanceof Error ? error.message : 'Unknown error'}`)
                )
              ])
            ]);

            execution.end(false, Date.now());
          }

          vscode.window.showErrorMessage(
            `Failed to create ${environmentName} runtime: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    );
  }

  /**
   * Executes a single notebook cell against the active runtime.
   * Handles WebSocket communication and output capture.
   *
   * @private
   * @async
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

    console.log('[RuntimeController] Executing code:', sourceCode.substring(0, 100));

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
  }

  /**
   * Ensures an active Datalayer runtime is available for execution.
   * Verifies existing runtime or uses the configured runtime.
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async _ensureRuntime(): Promise<void> {
    if (this._activeRuntime?.pod_name) {
      // Verify the runtime is still active
      try {
        const currentRuntime = await this._spacerApiService.getRuntime(
          this._activeRuntime.pod_name
        );

        if (
          currentRuntime &&
          (currentRuntime.status === 'running' || currentRuntime.status === 'ready') &&
          currentRuntime.ingress &&
          currentRuntime.token
        ) {
          this._activeRuntime = currentRuntime;
          return;
        }
      } catch (error) {
        console.warn('[RuntimeController] Runtime verification failed:', error);
      }
    }

    // For existing runtime controllers, the runtime should already be set
    if (this._config.type === RuntimeControllerType.ExistingRuntime) {
      if (!this._activeRuntime) {
        throw new Error('No runtime configured for existing runtime controller');
      }
      return;
    }

    throw new Error('Runtime not available for execution');
  }

  /**
   * Ensures a WebSocket connection to the Jupyter kernel is established.
   * Creates a new connection if needed or reuses an existing one.
   *
   * @private
   * @async
   * @returns {Promise<void>}
   */
  private async _ensureKernelConnection(): Promise<void> {
    if (
      this._kernelConnection &&
      this._kernelConnection.websocket.readyState === WebSocket.OPEN
    ) {
      return; // Connection is already active
    }

    if (!this._activeRuntime) {
      throw new Error('No active runtime available for kernel connection');
    }

    console.log('[RuntimeController] Establishing kernel connection...');

    try {
      // Create WebSocket connection to the kernel
      if (!this._activeRuntime.ingress) {
        throw new Error('Runtime ingress URL is not available');
      }

      const wsUrl = `${this._activeRuntime.ingress.replace('http', 'ws')}/api/kernels`;
      const websocket = new WebSocket(wsUrl, {
        headers: {
          Authorization: `Bearer ${this._activeRuntime.token}`,
        },
      });

      // Create session and kernel IDs
      const sessionId = uuidv4();
      const kernelId = uuidv4();

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
      console.error('[RuntimeController] Failed to establish kernel connection:', error);
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

      if (!parentMsgId || !this._pendingExecutions.has(parentMsgId)) {
        return; // Not related to our execution
      }

      const context = this._pendingExecutions.get(parentMsgId)!;
      const { execution } = context;

      console.log('[RuntimeController] Received kernel message:', message.header.msg_type);

      switch (message.header.msg_type) {
        case 'execute_reply':
          // Execution completed
          this._pendingExecutions.delete(parentMsgId);
          break;

        case 'stream':
          // Standard output/error
          const streamOutput = new vscode.NotebookCellOutput([
            vscode.NotebookCellOutputItem.text(
              message.content.text,
              message.content.name === 'stderr' ? 'text/x-stderr' : 'text/plain'
            )
          ]);
          execution.appendOutput([streamOutput]);
          break;

        case 'display_data':
        case 'execute_result':
          // Rich output (HTML, images, etc.)
          const outputItems: vscode.NotebookCellOutputItem[] = [];

          for (const [mimeType, data] of Object.entries(message.content.data || {})) {
            if (typeof data === 'string') {
              outputItems.push(vscode.NotebookCellOutputItem.text(data, mimeType));
            } else {
              outputItems.push(vscode.NotebookCellOutputItem.json(data, mimeType));
            }
          }

          if (outputItems.length > 0) {
            execution.appendOutput([new vscode.NotebookCellOutput(outputItems)]);
          }
          break;

        case 'error':
          // Execution error
          const error = new Error(message.content.evalue || 'Execution error');
          execution.appendOutput([
            new vscode.NotebookCellOutput([
              vscode.NotebookCellOutputItem.error(error)
            ])
          ]);
          this._pendingExecutions.delete(parentMsgId);
          break;
      }
    } catch (error) {
      console.error('[RuntimeController] Error handling kernel message:', error);
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
    console.log(`[RuntimeController] Controller disposed: ${this.getControllerId()}`);
  }
}