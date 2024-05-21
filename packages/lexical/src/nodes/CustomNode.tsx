/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { ReactNode } from "react";
import { DecoratorNode, EditorConfig, LexicalEditor, LexicalNode, NodeKey, SerializedLexicalNode } from "lexical";
import CustomComponent from "./CustomComponent";

export class CustomNode extends DecoratorNode<ReactNode> {
  private __data: any;

  /** @override */
  static getType() {
    return "custom";
  }

  /** @override */
  static clone(node: CustomNode) {
    console.log(`clone: node.__data: ${node.__data} node.__key: ${node.__key} node: ${JSON.stringify(node, null, 2)}`);
    return new CustomNode(node.__data, node.__key);
  }

  /** @override */
  constructor(data = "[]", key?: NodeKey) {
    super(key);
    this.__data = data;
  }

  /** @override */
  createDOM(config: EditorConfig) {
    const div = document.createElement("div");
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      div.className = className;
    }
    console.log("createDOM", div);
    return div;
  }

  /** @override */
  updateDOM() {
    return false;
  }

  /** @override */
  decorate(editor: LexicalEditor) {
    console.log(`decorate -> this.getKey(): ${this.getKey()} this.__data: ${this.__data}`);
    return <CustomComponent nodeKey={this.getKey()} data={this.__data} />;
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
    return new CustomNode((serializedNode as unknown as CustomNode).data);
  }

  /** @override */
  exportJSON() {
    return {
      data: this.__data,
      type: 'custom',
      version: 1,
    };
  }

}

export function $createCustomNode() {
  return new CustomNode();
}

export function $isCustomNode(node: LexicalNode) {
  return node instanceof CustomNode;
}
