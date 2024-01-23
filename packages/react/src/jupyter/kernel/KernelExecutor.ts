/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { IDisplayUpdate, IMimeBundle, IOutput } from '@jupyterlab/nbformat';
import { IOutputAreaModel, OutputAreaModel } from '@jupyterlab/outputarea';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { IClearOutputMsg } from '@jupyterlab/services/lib/kernel/messages';
import { PromiseDelegate } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { outputsAsString } from '../../utils/Utils';

export type IOPubMessageHook = (
  msg: KernelMessage.IIOPubMessage
) => boolean | PromiseLike<boolean>;
export type ShellMessageHook = (
  msg: KernelMessage.IShellMessage
) => boolean | PromiseLike<boolean>;

/**
 * KernelExecutor options
 */
export interface IKernelExecutorOptions {
  /**
   * Kernel connection
   */
  connection: Kernel.IKernelConnection;
  /**
   * Outputs model to populate with the execution results.
   */
  model?: IOutputAreaModel;
}

/**
 * A handler to execute code snippet.
 */
export class KernelExecutor {
  private _kernelConnection: Kernel.IKernelConnection;
  private _outputs: IOutput[];
  private _outputsChanged = new Signal<KernelExecutor, IOutput[]>(this);
  private _model: IOutputAreaModel;
  private _modelChanged = new Signal<KernelExecutor, IOutputAreaModel>(this);
  private _future?: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  >;
  private _shellMessageHooks = new Array<ShellMessageHook>();
  private _executed: PromiseDelegate<IOutputAreaModel>;

  constructor({ connection, model }: IKernelExecutorOptions) {
    this._kernelConnection = connection;
    this._outputs = [];
    this._model = model ?? new OutputAreaModel();
    this._executed = new PromiseDelegate<IOutputAreaModel>();
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
    }: {
      iopubMessageHooks?: IOPubMessageHook[];
      shellMessageHooks?: ShellMessageHook[];
    } = {}
  ): Promise<IOutputAreaModel> {
    const future = (this._future = this._kernelConnection.requestExecute({
      code,
      allow_stdin: false,
    }));
    iopubMessageHooks.forEach(hook => future.registerMessageHook(hook));
    this._shellMessageHooks = shellMessageHooks;
    future.onIOPub = this._onIOPub;
    future.onReply = this._onReply;

    // FIXME Handle stdin. It will require updating the `allow_stdin`
    // param above.
    // future.onStdin = msg => {
    //   if (KernelMessage.isInputRequestMsg(msg)) {
    //     this.onInputRequest(msg, value);
    //   }
    // };

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

  private _onIOPub = (message: KernelMessage.IIOPubMessage): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    const messageType: KernelMessage.IOPubMessageType = message.header.msg_type;
    const output = { ...message.content, output_type: messageType };
    switch (messageType) {
      case 'execute_result':
      case 'display_data':
      case 'stream':
      case 'error':
        this._outputs.push(message.content as IOutput);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
        break;
      case 'clear_output': {
        const wait = (message as IClearOutputMsg).content.wait;
        this._model.clear(wait);
        break;
      }
      case 'update_display_data':
        this._outputs.push(message.content as IDisplayUpdate);
        this._outputsChanged.emit(this._outputs);
        // FIXME this needs more advanced analysis see OutputArea
        this._model.add(output);
        this._modelChanged.emit(this._model);
        break;
      case 'status':
        {
          // execution_state: 'busy' 'starting' 'terminating' 'restarting' 'initializing' 'connecting' 'disconnected' 'dead' 'unknown' 'idle'
          const executionState = (message.content as any).execution_state;
          executionState;
        }
        break;
      default:
        break;
    }
  };

  private _onReply = (message: KernelMessage.IExecuteReplyMsg): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    this._shellMessageHooks.forEach(hook => hook(message));
    const content = message.content;
    if (content.status !== 'ok') {
      switch (content.status) {
        case 'abort':
          this._executed.reject('Execution aborted.');
          break;
        case 'error':
          {
            const { ename, evalue, traceback } = (
              content as any as KernelMessage.IErrorMsg
            ).content;
            this._executed.reject(
              `${ename}: ${evalue}\n${(traceback ?? []).join('\n')}`
            );
          }
          break;
      }
      return;
    }

    // API responses that contain a pager are special cased and their type
    // is overridden from 'execute_reply' to 'display_data' in order to
    // render output.
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

    // Wait for future to be done before resolving
    this._future.done.then(() => {
      this._executed.resolve(this._model);
    });
  };

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
      return outputsAsString(model.toJSON());
    });
  }

  /**
   * Kernel outputs emitted
   */
  get outputs() {
    return this._outputs;
  }

  /**
   * Signal emitted when the outputs list changes
   */
  get outputsChanged(): ISignal<KernelExecutor, IOutput[]> {
    return this._outputsChanged;
  }

  /**
   * Kernel outputs wrapped in a model
   */
  get model(): IOutputAreaModel {
    return this._model;
  }

  /**
   * Signal emitted when the outputs model changes
   */
  get modelChanged(): ISignal<KernelExecutor, IOutputAreaModel> {
    return this._modelChanged;
  }
}

export default KernelExecutor;
