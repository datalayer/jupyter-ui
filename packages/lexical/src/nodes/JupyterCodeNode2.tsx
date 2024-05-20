/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { LexicalEditor, EditorConfig, DecoratorNode, LexicalNode, NodeKey, Spread, SerializedLexicalNode } from "lexical";
import { UUID } from '@lumino/coreutils';
import { CODE_UUID_TO_OUTPUT_KEY } from "../plugins/JupyterPlugin";
import JupyterCodeNodeComponent from "../components/JupyterCellComponent";

export type SerializedJupyterCodeNode = Spread<
  {
    type: "jupyter-code",
    source: string;
    codeNodeUuid: string;
    version: 1;
  },
  SerializedLexicalNode
>;

export class JupyterCodeNode extends DecoratorNode<JSX.Element> {
  __code: string;
  __codeNodeUuid: string;

  /** @override */
  static getType() {
    return "jupyter-code";
  }

  /** @override */
  static clone(node: JupyterCodeNode) {
     return new JupyterCodeNode(
       node.getCode(),
       node.__codeNodeUuid,
       node.__key
       );
  }

  /** @override */
  static importJSON(serializedNode: SerializedJupyterCodeNode): JupyterCodeNode {
    return $createJupyterCodeNode(serializedNode.source);
  }

  /** @override */
  constructor(
    source: string,
    codeNodeUuid?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__codeNodeUuid = codeNodeUuid || UUID.uuid4();
    this.__code = source;
    CODE_UUID_TO_OUTPUT_KEY.set(this.__codeNodeUuid, this.__key);
  }

  setCode(code: string) {
    const self = this.getWritable();
    self.__code = code;
  }

  getCode(): string {
    const self = this.getLatest();
    return self.__code;
  }

  setCodeNodeUuid(codeNodeUuid: string) {
    const self = this.getWritable();
    self.__codeNodeUuid = codeNodeUuid;
  }

  getCodeNodeUuid(): string {
    const self = this.getLatest();
    return self.__codeNodeUuid;
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
    /*
    return <JupyterCodeNodeComponent
      code={this.getCode()}
      codeNodeUuid={this.__codeNodeUuid}
    />
    */
   return <>LLLLLLLLLLLLLLLLLLLLLLLLL</>
  }

  /** @override */
  exportJSON(): SerializedJupyterCodeNode {
    return {
      type: "jupyter-code",
      source: this.getCode(),
      codeNodeUuid: this.getCodeNodeUuid(),
      version: 1,
    };
  }

  /** @override */
  remove(_preserveEmptyParent?: boolean): void {
    // Do not delete JupyterCodeNode.
  }

  removeForce(): void {
    super.remove(false);
  }

  public executeCode(code: string) {
    this.setCode(code);
    alert(code);
//    this.___.execute(code);
//    this.setExecuteTrigger(this.getExecuteTrigger() + 1);
  }

}

export function $createJupyterCodeNode(
  code: string,
  ): JupyterCodeNode {
  return new JupyterCodeNode(
    code,
  );
}

export function $isJupyterCodeNode(node: LexicalNode) {
  return node instanceof JupyterCodeNode;
}
