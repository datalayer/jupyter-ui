/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  LexicalEditor,
  EditorConfig,
  DecoratorNode,
  LexicalNode,
  NodeKey,
  Spread,
  SerializedLexicalNode,
} from 'lexical';
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import {
  OUTPUT_UUID_TO_CODE_UUID,
  INPUT_UUID_TO_OUTPUT_KEY,
  INPUT_UUID_TO_OUTPUT_UUID,
  OUTPUT_UUID_TO_OUTPUT_KEY,
} from '../plugins/JupyterInputOutputPlugin';
import {
  Output,
  OutputAdapter,
  newUuid,
  Kernel,
} from '@datalayer/jupyter-react';
import { createNoKernelWarning } from './jupyterUtils';

export type SerializedJupyterOutputNode = Spread<
  {
    type: 'jupyter-output';
    source: string;
    outputs: IOutput[];
    jupyterInputNodeUuid: string;
    jupyterOutputNodeUuid: string;
    version: 1;
  },
  SerializedLexicalNode
>;

export class JupyterOutputNode extends DecoratorNode<JSX.Element> {
  __code: string;
  __outputs: IOutput[];
  __autoRun: boolean;
  __outputAdapter: OutputAdapter;
  __jupyterInputNodeUuid: string;
  __jupyterOutputNodeUuid: string;
  __executeTrigger: number;
  __renderTrigger: number;

  /** @override */
  static getType() {
    return 'jupyter-output';
  }

  /** @override */
  static clone(node: JupyterOutputNode) {
    return new JupyterOutputNode(
      node.getJupyterInput(),
      node.__outputAdapter,
      node.__outputs,
      node.__autoRun,
      node.__jupyterInputNodeUuid,
      node.__jupyterOutputNodeUuid,
      node.__key,
    );
  }

  /** @override */
  static importJSON(
    serializedNode: SerializedJupyterOutputNode,
  ): JupyterOutputNode {
    return $createJupyterOutputNode(
      serializedNode.source,
      new OutputAdapter(newUuid(), undefined, serializedNode.outputs),
      serializedNode.outputs,
      false,
      serializedNode.jupyterInputNodeUuid,
      serializedNode.jupyterOutputNodeUuid,
    );
  }

  /** @override */
  constructor(
    source: string,
    outputAdapter: OutputAdapter,
    outputs: IOutput[],
    autoRun: boolean,
    jupyterInputNodeUuid?: string,
    jupyterOutputNodeUuid?: string,
    key?: NodeKey,
  ) {
    super(key);
    this.__jupyterInputNodeUuid = jupyterInputNodeUuid || UUID.uuid4();
    this.__jupyterOutputNodeUuid = jupyterOutputNodeUuid || UUID.uuid4();
    this.__code = source;
    this.__outputs = outputs;
    this.__outputAdapter = outputAdapter;
    this.__executeTrigger = 0;
    this.__renderTrigger = 0;
    this.__autoRun = autoRun;
    OUTPUT_UUID_TO_CODE_UUID.set(
      this.__jupyterOutputNodeUuid,
      this.__jupyterInputNodeUuid,
    );
    INPUT_UUID_TO_OUTPUT_KEY.set(this.__jupyterInputNodeUuid, this.__key);
    INPUT_UUID_TO_OUTPUT_UUID.set(
      this.__jupyterInputNodeUuid,
      this.__jupyterOutputNodeUuid,
    );
    OUTPUT_UUID_TO_OUTPUT_KEY.set(this.__jupyterOutputNodeUuid, this.__key);
  }

  setJupyterInput(code: string) {
    const self = this.getWritable();
    self.__code = code;
  }

  getJupyterInput(): string {
    const self = this.getLatest();
    return self.__code;
  }

  setJupyterInputNodeUuid(jupyterInputNodeUuid: string) {
    const self = this.getWritable();
    self.__jupyterInputNodeUuid = jupyterInputNodeUuid;
  }

  getJupyterInputNodeUuid(): string {
    const self = this.getLatest();
    return self.__jupyterInputNodeUuid;
  }

  setJupyterOutputNodeUuid(jupyterOutputNodeUuid: string) {
    const self = this.getWritable();
    self.__jupyterOutputNodeUuid = jupyterOutputNodeUuid;
  }

  getJupyterOutputNodeUuid(): string {
    const self = this.getLatest();
    return self.__jupyterOutputNodeUuid;
  }

  setExecuteTrigger(executeTrigger: number) {
    const self = this.getWritable();
    self.__executeTrigger = executeTrigger;
  }

  getExecuteTrigger(): number {
    const self = this.getLatest();
    return self.__executeTrigger;
  }

  setAutoRun(autoRun: boolean) {
    const self = this.getWritable();
    self.__autoRun = autoRun;
  }

  getAutoRun(): boolean {
    const self = this.getLatest();
    return self.__autoRun;
  }

  setOutputs(outputs: IOutput[]) {
    const self = this.getWritable();
    self.__outputs = outputs;
  }

  getOutputs(): IOutput[] {
    const self = this.getLatest();
    return self.__outputs;
  }

  /** @override */
  createDOM(): HTMLElement {
    return document.createElement('span');
  }

  /** @override */
  updateDOM(): false {
    return false;
  }

  /** @override */
  isTopLevel(): boolean {
    return true;
  }

  /** @override */
  isIsolated(): boolean {
    return false;
  }

  /** @override */
  decorate(_editor: LexicalEditor, _config: EditorConfig) {
    return (
      <Output
        code={this.getJupyterInput()}
        outputs={this.__outputs}
        adapter={this.__outputAdapter}
        id={this.__jupyterOutputNodeUuid}
        executeTrigger={this.getExecuteTrigger() + this.__renderTrigger}
        autoRun={this.__autoRun}
        lumino={true}
      />
    );
  }

  /** @override */
  exportJSON(): SerializedJupyterOutputNode {
    return {
      type: 'jupyter-output',
      source: this.getJupyterInput(),
      outputs: this.__outputAdapter.outputArea.model.toJSON(),
      jupyterInputNodeUuid: this.getJupyterInputNodeUuid(),
      jupyterOutputNodeUuid: this.getJupyterOutputNodeUuid(),
      version: 1,
    };
  }

  /** @override */
  remove(_preserveEmptyParent?: boolean): void {
    // Do not delete JupyterOutputNode.
  }

  removeForce(): void {
    super.remove(false);
  }

  public executeCode(code: string) {
    const self = this.getWritable();
    self.__code = code;

    if (!self.__outputAdapter.kernel) {
      // Show user-facing warning instead of just logging
      const warningOutput = createNoKernelWarning();

      // Update BOTH the node's outputs AND the adapter's model
      self.__outputs = [warningOutput];
      self.__outputAdapter.setOutputs([warningOutput]);

      // Force re-render by incrementing renderTrigger
      self.__renderTrigger++;
      return;
    }

    // Execute with kernel
    self.__outputAdapter.execute(code);
  }

  public updateKernel(kernel: Kernel | undefined) {
    const self = this.getWritable();
    self.__outputAdapter.kernel = kernel;
  }
}

export function $createJupyterOutputNode(
  code: string,
  outputAdapter: OutputAdapter,
  outputs: IOutput[],
  autoRun: boolean,
  jupyterInputNodeUuid: string,
  jupyterOutputNodeUuid: string,
): JupyterOutputNode {
  return new JupyterOutputNode(
    code,
    outputAdapter,
    outputs,
    autoRun,
    jupyterInputNodeUuid,
    jupyterOutputNodeUuid,
  );
}

export function $isJupyterOutputNode(node: LexicalNode) {
  return node instanceof JupyterOutputNode;
}
