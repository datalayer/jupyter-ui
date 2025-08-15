/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IOutputAreaModel } from '@jupyterlab/outputarea';
import {
  Kernel as JupyterKernel,
  KernelMessage,
  KernelSpec,
  Session,
} from '@jupyterlab/services';
import { ConnectionStatus } from '@jupyterlab/services/lib/kernel/kernel';
import { ISessionConnection } from '@jupyterlab/services/lib/session/session';
import { find } from '@lumino/algorithm';
import { PromiseDelegate } from '@lumino/coreutils';
import { getCookie, newUuid } from '../../utils/Utils';
import KernelExecutor, {
  IExecutionPhaseOutput,
  IOPubMessageHook,
  ShellMessageHook,
} from './KernelExecutor';

const JUPYTER_REACT_PATH_COOKIE_NAME = 'jupyter-react-kernel-path';

/**
 * Jupyter Kernel handler
 */
export class Kernel {
  private _clientId: string;
  private _connectionStatus: ConnectionStatus;
  private _id: string;
  private _info?: KernelMessage.IInfoReply;
  private _kernelConnection: JupyterKernel.IKernelConnection | null;
  private _kernelManager: JupyterKernel.IManager;
  private _kernelName: string;
  private _kernelSpecManager: KernelSpec.IManager;
  private _kernelSpecName: string;
  private _kernelType: string;
  private _path: string;
  private _ready: PromiseDelegate<void>;
  private _session: ISessionConnection;
  private _sessionId: string;
  private _sessionManager: Session.IManager;

  public constructor(props: Kernel.IKernelProps) {
    const {
      kernelManager,
      kernelName,
      kernelType,
      kernelspecsManager,
      kernelSpecName,
      kernelModel,
      path,
      sessionManager,
    } = props;
    this._kernelSpecManager = kernelspecsManager;
    this._kernelManager = kernelManager;
    this._kernelName = kernelName;
    this._kernelType = kernelType ?? 'notebook';
    this._kernelSpecName = kernelSpecName;
    this._sessionManager = sessionManager;
    this._ready = new PromiseDelegate();
    this.requestKernel(kernelModel, path);
  }

  private async requestKernel(
    kernelModel?: JupyterKernel.IModel,
    propsPath?: string
  ): Promise<void> {
    await this._kernelManager.ready;
    await this._sessionManager.ready;
    if (kernelModel) {
      await this._kernelManager.refreshRunning();
      const runningKernels = Array.from(this.kernelManager.running());
      const existingKernelModel = find(runningKernels, model => {
        return kernelModel.id === model.id;
      });
      if (existingKernelModel) {
        console.log(
          'Creating a session to an existing Jupyter Kernel model.',
          existingKernelModel
        );
        const path = 'kernel-' + kernelModel.id;
        this._path = path;
        this._session = await this._sessionManager.startNew(
          {
            name: existingKernelModel.name,
            path: path,
            type: 'notebook',
            kernel: existingKernelModel as Partial<
              JupyterKernel.IModel &
                Omit<JupyterKernel.IKernelOptions, 'kernelType'>
            >,
          },
          {
            kernelConnectionOptions: {
              handleComms: true,
            },
          }
        );
      } else {
        console.log(
          'Something is wrong... can not find an existing model for',
          kernelModel
        );
        return;
      }
    } else {
      let path = propsPath ?? getCookie(this.cookieName);
      if (!path) {
        path = 'path-' + newUuid();
        document.cookie = this.cookieName + '=' + path;
      }
      this._path = path;
      this._session = await this._sessionManager.startNew(
        {
          name: this._kernelName,
          path: this._path,
          type: this._kernelType,
          kernel: {
            name: this._kernelSpecName,
          },
        },
        {
          kernelConnectionOptions: {
            handleComms: true,
          },
        }
      );
    }
    this._kernelConnection = this._session.kernel;
    const updateConnectionStatus = () => {
      if (this._connectionStatus === 'connected') {
        this._clientId = this._session.kernel!.clientId;
        this._id = this._session.kernel!.id;
        this._ready.resolve();
      }
    };
    if (this._kernelConnection) {
      this._sessionId = this._session.id;
      this._connectionStatus = this._kernelConnection.connectionStatus;
      updateConnectionStatus();
      this._kernelConnection.connectionStatusChanged.connect(
        (_, connectionStatus) => {
          this._connectionStatus = connectionStatus;
          updateConnectionStatus();
        }
      );
      this._kernelConnection.info.then(info => {
        this._info = info;
        console.log('Kernel Information.', info);
        console.log('Kernel Session.', this._session);
        console.log('Kernel Details.', this.toJSON());
      });
    }
  }

  get clientId(): string {
    return this._clientId;
  }

  get connection(): JupyterKernel.IKernelConnection | null {
    return this._kernelConnection;
  }

  get cookieName(): string {
    return JUPYTER_REACT_PATH_COOKIE_NAME + '_' + this._kernelSpecName;
  }

  get id(): string {
    return this._id;
  }

  get info(): KernelMessage.IInfoReply | undefined {
    return this._info;
  }

  get kernelManager(): JupyterKernel.IManager {
    return this._kernelManager;
  }

  get kernelSpecManager(): KernelSpec.IManager {
    return this._kernelSpecManager;
  }

  get path(): string {
    return this._path;
  }

  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get session(): ISessionConnection {
    return this._session;
  }

  get sessionManager(): Session.IManager {
    return this._sessionManager;
  }

  /**
   * Execute a code snippet
   *
   * @param code The code snippet
   * @param options Callbacks on IOPub messages and on reply message,
   *  outputs model to populate and execution options
   * @returns The kernel executor
   */
  execute(
    code: string,
    {
      model,
      iopubMessageHooks = [],
      shellMessageHooks = [],
      silent,
      stopOnError,
      storeHistory,
      allowStdin,
      suppressCodeExecutionErrors = false,
      onExecutionPhaseChanged,
    }: {
      model?: IOutputAreaModel;
      iopubMessageHooks?: IOPubMessageHook[];
      shellMessageHooks?: ShellMessageHook[];
      silent?: boolean;
      stopOnError?: boolean;
      storeHistory?: boolean;
      allowStdin?: boolean;
      suppressCodeExecutionErrors?: boolean;
      onExecutionPhaseChanged?: (phaseOutput: IExecutionPhaseOutput) => void;
    } = {}
  ): KernelExecutor | undefined {
    if (this._kernelConnection) {
      const kernelExecutor = new KernelExecutor({
        connection: this._kernelConnection,
        model,
        onExecutionPhaseChanged,
      });
      kernelExecutor.execute(code, {
        iopubMessageHooks,
        shellMessageHooks,
        silent,
        stopOnError,
        storeHistory,
        allowStdin,
        suppressCodeExecutionErrors,
      });
      return kernelExecutor;
    }
  }

  /**
   * Interrupt the kernel
   */
  interrupt(): Promise<void> {
    return this._kernelConnection?.interrupt() ?? Promise.resolve();
  }

  /**
   * Restart the kernel
   */
  restart(): Promise<void> {
    return this._kernelConnection?.restart() ?? Promise.resolve();
  }

  /**
   * Shutdown the kernel
   */
  async shutdown(): Promise<void> {
    await this._session.kernel?.shutdown();
    this.connection?.dispose();
  }

  /**
   * Serialize the kernel to JSON
   */
  toJSON() {
    return {
      path: this._path,
      id: this.id,
      clientId: this.clientId,
      sessionId: this.sessionId,
      kernelInfo: this.info,
    };
  }

  /**
   * Serialize the kernel to string
   */
  toString() {
    return `id:${this.id} - client_id:${this.clientId} - session_id:${this.sessionId} - path:${this._path}`;
  }
}

export namespace Kernel {
  /**
   * Kernel options
   */
  export type IKernelProps = {
    /**
     * A path
     */
    path?: string;
    /**
     * Kernel manager
     */
    kernelManager: JupyterKernel.IManager;
    /**
     * Kernel specs manager
     */
    kernelspecsManager: KernelSpec.IManager;
    /**
     * Kernel name
     */
    kernelName: string;
    /**
     * Kernel spec name
     */
    kernelSpecName: string;
    /**
     * Kernel type
     */
    kernelType?: 'notebook' | 'file' | undefined;
    /**
     * Session manager
     */
    sessionManager: Session.IManager;
    /**
     * Kernel model
     */
    kernelModel?: JupyterKernel.IModel;
  };
}

export default Kernel;
