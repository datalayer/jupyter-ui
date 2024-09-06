/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { PromiseDelegate } from '@lumino/coreutils';
import { Signal, ISignal } from '@lumino/signaling';
import {
  IOutput,
  IStream,
  IExecuteResult,
  IDisplayData,
  IDisplayUpdate,
  IMimeBundle,
} from '@jupyterlab/nbformat';
import { IOutputAreaModel, OutputAreaModel } from '@jupyterlab/outputarea';
import { Kernel as JupyterKernel, KernelMessage } from '@jupyterlab/services';
import { IClearOutputMsg } from '@jupyterlab/services/lib/kernel/messages';
import { outputsAsString } from '../../utils/Utils';
import { ExecutionPhase, KernelsState, kernelsStore } from './KernelState';
import { toKernelState } from '../../components/kernel';

export type IOPubMessageHook = (
  msg: KernelMessage.IIOPubMessage
) => boolean | PromiseLike<boolean>;

export type ShellMessageHook = (
  msg: KernelMessage.IShellMessage
) => boolean | PromiseLike<boolean>;

/**
 * KernelExecutor options
 */
export type IKernelExecutorOptions = {
  /**
   * Kernel connection
   */
  connection: JupyterKernel.IKernelConnection;
  /**
   * Outputs model to populate with the execution results.
   */
  model?: IOutputAreaModel;
  /**
   * Flag defining if notification about model changes
   * must only be made when execution complete
   */
  notifyOnComplete? : boolean;
}

export class KernelExecutor {
  private _executed: PromiseDelegate<IOutputAreaModel>;
  private _kernelConnection: JupyterKernel.IKernelConnection;
  private _kernelState: KernelsState;
  private _model: IOutputAreaModel;
  private _modelChanged = new Signal<KernelExecutor, IOutputAreaModel>(this);
  private _outputs: IOutput[];
  private _stopOnError: boolean;
  private _outputsChanged = new Signal<KernelExecutor, IOutput[]>(this);
  private _future?: JupyterKernel.IFuture<KernelMessage.IExecuteRequestMsg, KernelMessage.IExecuteReplyMsg>;
  private _shellMessageHooks = new Array<ShellMessageHook>();
  private _notifyOnComplete : boolean = false;

  public constructor({ connection, model, notifyOnComplete }: IKernelExecutorOptions) {
    this._executed = new PromiseDelegate<IOutputAreaModel>();
    this._kernelConnection = connection;
    this._model = model ?? new OutputAreaModel();
    this._outputs = [];
    this._kernelState = kernelsStore.getState();
    this._notifyOnComplete = !!notifyOnComplete;
  }

  /**
   * Execute a code snippet.
   *
   * @param code Code to be executed
   * @param options Callbacks on IOPub messages and on reply message
   * @returns The outputs model
   *
   * @example
   * Here is an example to execute the code snippet `print('hello')`.
   *
   * ```ts
   * const executor = new KernelExecutor(kernelConnection);
   * const outputs = await executor.execute("print('hello')");
   * ```
   */
  execute(
    code: string,
    {
      iopubMessageHooks = [],
      shellMessageHooks = [],
      silent = false,
      stopOnError = true,
      storeHistory = true,
      allowStdin = false,
    }: {
      iopubMessageHooks?: IOPubMessageHook[];
      shellMessageHooks?: ShellMessageHook[];
      silent?: boolean;
      stopOnError?: boolean;
      storeHistory?: boolean;
      allowStdin?: boolean;
    } = {}
  ): Promise<IOutputAreaModel> {
    this._stopOnError = stopOnError;
    this._shellMessageHooks = shellMessageHooks;
    kernelsStore.getState().setExecutionPhase(this._kernelConnection.id, ExecutionPhase.running);
    this._future = this._kernelConnection.requestExecute({
      code,
      allow_stdin: allowStdin,
      silent,
      stop_on_error: stopOnError,
      store_history: storeHistory,
    });
    this._future.onIOPub = this._onIOPub;
    this._future.onReply = this._onReply;
    iopubMessageHooks.forEach(hook => this._future!.registerMessageHook(hook));
    this._future.onStdin = msg => {
      if (KernelMessage.isInputRequestMsg(msg)) {
        // FIXME Implement this...
        // this.onInputRequest(msg, value);
      }
    };
    // Wait for future to be done before resolving the exectud promise.
    this._future.done.then(() => {
      kernelsStore.getState().setExecutionPhase(this._kernelConnection.id, ExecutionPhase.completed);
      // We emit model changes only when execution completed
      if (this._notifyOnComplete) {
        this._modelChanged.emit(this._model);
      }    
      this._executed.resolve(this._model);
    });
    return this._executed.promise;
  }

  /**
   * Clear the kernel executor previous results.
   */
  clear(): void {
    this._shellMessageHooks.length = 0;
    this._outputs.length = 0;
    this._model.clear();
  }

  registerIOPubMessageHook = (msg: IOPubMessageHook) => {
    this._future?.registerMessageHook(msg);
  };

  /**
   * 
   */
  get future(): JupyterKernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    > | undefined {
    return this._future;
  }

  /**
   * Promise that resolves when the execution is done.
   */
  get done(): Promise<void> {
    return this._executed.promise.then(() => {
      return;
    });
  }

  /**
   * Code execution result as serialized JSON
   */
  get result(): Promise<string> {
    return this._executed.promise.then(model => {
      console.log('---', model)
      return outputsAsString(model.toJSON());
    });
  }

  /**
   * Kernel outputs emitted.
   */
  get outputs(): IOutput[] {
    return this._outputs;
  }

  /**
   * Kernel outputs wrapped in a model.
   */
  get model(): IOutputAreaModel {
    return this._model;
  }

  /**
   * Signal emitted when the outputs list changes.
   */
  get outputsChanged(): ISignal<KernelExecutor, IOutput[]> {0
    return this._outputsChanged;
  }

  /**
   * Signal emitted when the outputs model changes.
   */
  get modelChanged(): ISignal<KernelExecutor, IOutputAreaModel> {
    return this._modelChanged;
  }

  private _onIOPub = (message: KernelMessage.IIOPubMessage): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    console.debug('Kernel IOPub message', message);
    const messageType: KernelMessage.IOPubMessageType = message.header.msg_type;
    const output = { ...message.content, output_type: messageType };
    switch (messageType) {
      case 'execute_result':
        this._outputs.push(message.content as IExecuteResult);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        if (!this._notifyOnComplete) {
          this._modelChanged.emit(this._model);
        }
        break;
      case 'display_data':
        this._outputs.push(message.content as IDisplayData);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        if (!this._notifyOnComplete) {
          this._modelChanged.emit(this._model);
        }
        break;
      case 'stream':
      case 'error':
        this._outputs.push(message.content as IStream);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
        if (this._stopOnError) {
          kernelsStore.getState().setExecutionPhase(this._kernelConnection.id, ExecutionPhase.completed_with_error);
        }
        break;
      case 'clear_output':
        const wait = (message as IClearOutputMsg).content.wait;
        this._model.clear(wait);
        break;
      case 'update_display_data':
        this._outputs.push(message.content as IDisplayUpdate);
        this._outputsChanged.emit(this._outputs);
        // FIXME this needs more advanced analysis see OutputArea
        this._model.add(output);
        if (!this._notifyOnComplete) {
          this._modelChanged.emit(this._model);
        }
        break;
      case 'status':
        const executionState = (message.content as any).execution_state as KernelMessage.Status;
        const connectionStatus = this._kernelConnection.connectionStatus;
        const kernelState = toKernelState(connectionStatus!, executionState);
        this._kernelState.setExecutionState(this._kernelConnection.id, kernelState);
        break;
      default:
        break;
    }
  };

  private _onReply = (message: KernelMessage.IExecuteReplyMsg): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    console.debug('Kernel Reply message', message);
    this._shellMessageHooks.forEach(hook => hook(message));
    const content = message.content;
    if (content.status !== 'ok') {
      switch (content.status) {
        case 'abort':
          this._executed.reject('Execution aborted.');
          break;
        case 'error':
          {
            const { ename, evalue, traceback } = content as KernelMessage.IReplyErrorContent;
            this._executed.reject(`${ename}: ${evalue}\n${(traceback ?? []).join('\n')}`);
          }
          break;
      }
      return;
    }
    // API responses that contain a pager are special cased and their type
    // is overridden from 'execute_reply' to 'display_data' in order to render output.
    const payload = content?.payload;
    if (payload?.length) {
      const pages = payload.filter((i: any) => i.source === 'page');
      if (pages.length) {
        const page = JSON.parse(JSON.stringify(pages[0]));
        const output: IOutput = {
          output_type: 'display_data',
          data: (page as any).data as IMimeBundle,
          metadata: {},
        };
        this._outputs.push(output);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
      }
    }
  };

}

export default KernelExecutor;
