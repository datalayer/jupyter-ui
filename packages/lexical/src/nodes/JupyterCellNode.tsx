/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { ReactNode } from 'react';
import {
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
} from 'lexical';
import { IOutput } from '@jupyterlab/nbformat';
import { JupyterCellProps } from './../plugins/JupyterCellPlugin';
import { Cell, type JupyterVariant } from '@datalayer/jupyter-react';
import { debugLog } from '../utils/debugLog';

const TYPE = 'jupyter-cell';

export class JupyterCellNode extends DecoratorNode<ReactNode> {
  private __code: string;
  private __outputs: IOutput[];
  private __loading: string;
  private __autoStart: boolean;
  private __data: any;
  private __variant?: JupyterVariant;

  /** @override */
  static getType() {
    return TYPE;
  }

  /** @override */
  static clone(node: JupyterCellNode) {
    console.debug(`clone: node: ${JSON.stringify(node, null, 2)}`);
    return new JupyterCellNode(
      node.__code,
      node.__outputs,
      node.__loading,
      node.__autoStart,
      node.__data,
      node.__key,
      node.__variant,
    );
  }

  /** @override */
  constructor(
    code: string,
    outputs: IOutput[],
    loading: string,
    autoStart: boolean,
    data = '[]',
    key?: NodeKey,
    variant?: JupyterVariant,
  ) {
    super(key);
    this.__code = code;
    this.__outputs = outputs;
    this.__loading = loading;
    this.__autoStart = autoStart;
    this.__data = data;
    this.__variant = variant;
  }

  /** @override */
  createDOM(config: EditorConfig) {
    const div = document.createElement('div');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    debugLog('createDOM', div);
    return div;
  }

  /** @override */
  updateDOM() {
    return false;
  }

  /** @override */
  decorate(editor: LexicalEditor) {
    debugLog(
      `decorate -> key: ${this.getKey()} outputs: ${this.__outputs} data: ${this.__data}`,
    );
    return (
      <Cell
        source={this.__code}
        outputs={this.__outputs}
        autoStart={this.__autoStart}
        variant={this.__variant}
      />
    );
  }

  setCode(code: string) {
    const self = this.getWritable();
    self.__code = code;
  }
  get code() {
    return this.__code;
  }

  setOutputs(outputs: IOutput[]) {
    const self = this.getWritable();
    self.__outputs = outputs;
  }
  get outputs() {
    return this.__outputs;
  }

  setLoading(loading: string) {
    const self = this.getWritable();
    self.__loading = loading;
  }
  get loading() {
    return this.__loading;
  }

  setAutostart(autoStart: boolean) {
    const self = this.getWritable();
    self.__autoStart = autoStart;
  }
  get autoStart() {
    return this.__autoStart;
  }

  /** `marimo` for a reactive cell; unset means the kernel's own variant. */
  get variant(): JupyterVariant | undefined {
    return this.__variant;
  }

  /** @override */
  setData(data: any) {
    const self = this.getWritable();
    self.__data = data;
  }
  get data() {
    return this.__data;
  }

  /** @override */
  static importJSON(serializedNode: SerializedLexicalNode) {
    const n = serializedNode as unknown as JupyterCellNode;
    return new JupyterCellNode(
      n.code,
      n.outputs,
      n.loading,
      n.autoStart,
      n.data,
      undefined,
      n.variant,
    );
  }

  /** @override */
  exportJSON() {
    return {
      code: this.__code,
      outputs: this.__outputs,
      loading: this.__loading,
      autoStart: this.__autoStart,
      data: this.__data,
      variant: this.__variant,
      type: TYPE,
      version: 1,
    };
  }
}

export function $createJupyterCellNode(props: JupyterCellProps) {
  const { code, outputs, loading, autoStart } = props;
  return new JupyterCellNode(code, outputs, loading, autoStart);
}

export function $isJupyterCellNode(node: LexicalNode) {
  return node instanceof JupyterCellNode;
}
