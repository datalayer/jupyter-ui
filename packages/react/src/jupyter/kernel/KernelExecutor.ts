/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Signal } from '@lumino/signaling';
import { IOutput, IStream, IExecuteResult, IDisplayData, IDisplayUpdate, IMimeBundle } from '@jupyterlab/nbformat';
import { IOutputAreaModel, OutputAreaModel } from '@jupyterlab/outputarea';
import { Kernel, KernelMessage } from '@jupyterlab/services';

export class KernelExecutor {
  private _kernelConnection: Kernel.IKernelConnection;
  private _outputs: IOutput[];
  private _outputsChanged = new Signal<KernelExecutor, IOutput[]>(this);
  private _outputAreaModel: IOutputAreaModel;
  private _outputAreaModelChanged = new Signal<KernelExecutor, IOutputAreaModel>(this);
  private _executeReplyReceived = new Signal<KernelExecutor, IOutputAreaModel>(this);
  private _future?: Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  >;
  private _executed: Promise<void>;
  private _executedResolve: () => void;

  constructor(kernelConnection: Kernel.IKernelConnection) {
    this._kernelConnection = kernelConnection;
    this._outputs = [];
    this._outputAreaModel = new OutputAreaModel();
    this._executed = new Promise((resolve, _) => {
      this._executedResolve = resolve;
    });
  }

  execute(code: string): Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | undefined {
    const future = this._kernelConnection.requestExecute({
      code,
    });
    this.future = future;
    return future;
  }

  private _onIOPub = (message: KernelMessage.IIOPubMessage): void => {
    const messageType = message.header.msg_type;
    const output = { ...message.content, output_type: messageType };
    switch (messageType) {
      case 'execute_result':
        this._outputs.push(message.content as IExecuteResult);
        this._outputsChanged.emit(this._outputs);
        this._outputAreaModel.add(output);
        this._outputAreaModelChanged.emit(this._outputAreaModel);
        break;
      case 'stream':
        this._outputs.push(message.content as IStream);
        this._outputsChanged.emit(this._outputs);
        this._outputAreaModel.add(output);
        this._outputAreaModelChanged.emit(this._outputAreaModel);
        break;  
      case 'display_data':
        this._outputs.push(message.content as IDisplayData);
        this._outputsChanged.emit(this._outputs);
        this._outputAreaModel.add(output);
        this._outputAreaModelChanged.emit(this._outputAreaModel);
        break;
      case 'update_display_data':
        this._outputs.push(message.content as IDisplayUpdate);
        this._outputsChanged.emit(this._outputs);
        this._outputAreaModel.add(output);
        this._outputAreaModelChanged.emit(this._outputAreaModel);
        break;
      default:
        break;
    }
  }

  private _onReply = (message: KernelMessage.IShellMessage): void => {
    const messageType = message.header.msg_type;
    switch (messageType) {
      case 'execute_reply':
        const output: IOutput = {
          output_type: 'display_data',
          data: (message.content as IExecuteResult).data as IMimeBundle,
          metadata: {}
        };
        this._outputs.push(message.content as IExecuteResult);
        this._outputsChanged.emit(this._outputs);
        this._outputAreaModel.add(output);
        this.executeReplyReceived.emit(this._outputAreaModel);
        this._executedResolve();
        break;
      default:
        break;
    }
  }

  get executed(): Promise<void> {
    return this._executed;
  }

  get future(): Kernel.IFuture<
    KernelMessage.IExecuteRequestMsg,
    KernelMessage.IExecuteReplyMsg
  > | undefined {
    return this._future;
  }

  set future(
    value: Kernel.IFuture<
      KernelMessage.IExecuteRequestMsg,
      KernelMessage.IExecuteReplyMsg
    > | undefined
  ) {
    this._future = value;
    if (!value) {
      return;
    }
    value.onIOPub = this._onIOPub;
    value.onReply = this._onReply
  }

  get outputs() {
    return this._outputs;
  }

  get outputsChanged() {
    return this._outputsChanged;
  }

  get outputAreaModel() {
    return this._outputAreaModel;
  }

  get outputAreaModelChanged() {
    return this._outputAreaModelChanged;
  }

  get executeReplyReceived() {
    return this._executeReplyReceived;
  }

}

export default KernelExecutor;
