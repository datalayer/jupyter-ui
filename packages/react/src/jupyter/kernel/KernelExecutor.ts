/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Signal } from '@lumino/signaling';
import {
  IOutput,
  IStream,
  IExecuteResult,
  IDisplayData,
  IDisplayUpdate,
  IMimeBundle,
} from '@jupyterlab/nbformat';
import { IOutputAreaModel, OutputAreaModel } from '@jupyterlab/outputarea';
import { Kernel, KernelMessage } from '@jupyterlab/services';
import { outputsAsString } from '../../utils/Utils';

export type IOPubMessageHook = (
  msg: KernelMessage.IIOPubMessage
) => boolean | PromiseLike<boolean>;
export type ShellMessageHook = (
  msg: KernelMessage.IShellMessage
) => boolean | PromiseLike<boolean>;
export type ExecutionResult = {
    future: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  >
  | undefined,
executor: KernelExecutor
}

export class KernelExecutor {
  private _kernelConnection: Kernel.IKernelConnection;
  private _outputs: IOutput[];
  private _outputsChanged = new Signal<KernelExecutor, IOutput[]>(this);
  private _model: IOutputAreaModel;
  private _modelChanged = new Signal<KernelExecutor, IOutputAreaModel>(this);
  private _executeReplyReceived = new Signal<KernelExecutor, IOutputAreaModel>(
    this
  );
  private _future?: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  >;
  private _shellMessageHooks: Array<ShellMessageHook>;
  private _executed: Promise<IOutputAreaModel>;
  private _executedResolve: (model: IOutputAreaModel) => void;

  constructor(kernelConnection: Kernel.IKernelConnection) {
    this._kernelConnection = kernelConnection;
    this._outputs = [];
    this._model = new OutputAreaModel();
    this._executed = new Promise<IOutputAreaModel>((resolve, _) => {
      this._executedResolve = resolve;
    });
  }

  execute(
    code: string,
    iopubMessageHooks: IOPubMessageHook[] = [],
    shellMessageHooks: ShellMessageHook[] = []
  ): ExecutionResult {
    const future = this._kernelConnection.requestExecute({
      code,
    });
    iopubMessageHooks.forEach(hook => future.registerMessageHook(hook));
    this._shellMessageHooks = shellMessageHooks;
    this.future = future;
    return { 
      future,
      executor: this,
    };
  }

  private _onIOPub = (message: KernelMessage.IIOPubMessage): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    const messageType: KernelMessage.IOPubMessageType = message.header.msg_type;
    const output = { ...message.content, output_type: messageType };
    switch (messageType) {
      case 'execute_result':
        this._outputs.push(message.content as IExecuteResult);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
        break;
      case 'stream':
        this._outputs.push(message.content as IStream);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
        break;
      case 'display_data':
        this._outputs.push(message.content as IDisplayData);
        this._outputsChanged.emit(this._outputs);
        this._model.add(output);
        this._modelChanged.emit(this._model);
        break;
      case 'update_display_data':
        this._outputs.push(message.content as IDisplayUpdate);
        this._outputsChanged.emit(this._outputs);
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

  private _onReply = (message: KernelMessage.IShellMessage): void => {
    if (this._future?.msg.header.msg_id !== message.parent_header.msg_id) {
      return;
    }
    const messageType: KernelMessage.ShellMessageType = message.header.msg_type;
    this._shellMessageHooks.forEach(hook => hook(message));
    switch (messageType) {
      case 'execute_reply':
        {
          const output: IOutput = {
            output_type: 'display_data',
            data: (message.content as IExecuteResult).data as IMimeBundle,
            metadata: {},
          };
          this._outputs.push(message.content as IExecuteResult);
          this._outputsChanged.emit(this._outputs);
          this._model.add(output);
          this.executeReplyReceived.emit(this._model);
          this._executedResolve(this._model);
        }
        break;
      default:
        break;
    }
  };

  registerIOPubMessageHook = (msg: IOPubMessageHook) => {
    this._future?.registerMessageHook(msg);
  };

  get executed(): Promise<IOutputAreaModel> {
    return this._executed;
  }

  get future():
    | Kernel.IFuture<
        KernelMessage.IExecuteRequestMsg,
        KernelMessage.IExecuteReplyMsg
      >
    | undefined {
    return this._future;
  }

  set future(
    value:
      | Kernel.IFuture<
          KernelMessage.IExecuteRequestMsg,
          KernelMessage.IExecuteReplyMsg
        >
      | undefined
  ) {
    this._future = value;
    if (!value) {
      return;
    }
    value.onIOPub = this._onIOPub;
    value.onReply = this._onReply;
  }

  get result(): Promise<string> {
    return this.executed.then(model => {
      return outputsAsString(model.toJSON());
    });
  }

  get outputs() {
    return this._outputs;
  }

  get outputsChanged() {
    return this._outputsChanged;
  }

  get model() {
    return this._model;
  }

  get modelChanged() {
    return this._modelChanged;
  }

  get executeReplyReceived() {
    return this._executeReplyReceived;
  }

  get done() {
    return this._future?.done as Promise<KernelMessage.IExecuteReplyMsg>;
  }
}

export default KernelExecutor;
