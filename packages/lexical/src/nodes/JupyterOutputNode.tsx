import { LexicalEditor, EditorConfig, DecoratorNode, LexicalNode, NodeKey, Spread, SerializedLexicalNode } from "lexical";
import { UUID } from '@lumino/coreutils';
import { IOutput } from '@jupyterlab/nbformat';
import { OUTPUT_UUID_TO_CODE_UUID, CODE_UUID_TO_OUTPUT_KEY, CODE_UUID_TO_OUTPUT_UUID, OUTPUT_UUID_TO_OUTPUT_KEY } from "../plugins/JupyterPlugin";
import { OutputAdapter } from "@datalayer/jupyter-react";
import JupyterOutputComponent from "../components/JupyterOutputComponent";

export type SerializedJupyterOutputNode = Spread<
  {
    type: "jupyter-output",
    source: string;
    outputs: IOutput[];
    codeNodeUuid: string;
    outputNodeUuid: string;
    version: 1;
  },
  SerializedLexicalNode
>;

export class JupyterOutputNode extends DecoratorNode<JSX.Element> {
  __code: string;
  __outputs: IOutput[];
  __outputAdapter: OutputAdapter;
  __codeNodeUuid: string;
  __outputNodeUuid: string;
  __executeTrigger: number;

  /** @override */
  static getType() {
    return "jupyter-output";
  }

  /** @override */
  static clone(node: JupyterOutputNode) {
     return new JupyterOutputNode(
       node.getCode(),
       node.__outputAdapter,
       node.__outputs,
       node.__autoRun,
       node.__codeNodeUuid,
       node.__outputNodeUuid,
       node.__key
       );
  }

  /** @override */
  static importJSON(serializedNode: SerializedJupyterOutputNode): JupyterOutputNode {
    return $createJupyterOutputNode(serializedNode.source, new OutputAdapter(undefined, []), serializedNode.outputs, false, serializedNode.codeNodeUuid, serializedNode.outputNodeUuid);
  }

  /** @override */
  constructor(
    source: string,
    outputAdapter: OutputAdapter,
    outputs: IOutput[],
    autoRun: boolean,
    codeNodeUuid?: string,
    outputNodeUuid?: string,
    key?: NodeKey
  ) {
    super(key);
    this.__codeNodeUuid = codeNodeUuid || UUID.uuid4();
    this.__outputNodeUuid = outputNodeUuid || UUID.uuid4();
    this.__code = source;
    this.__outputs = outputs;
    this.__outputAdapter = outputAdapter;
    this.__executeTrigger = 0;
    this.__autoRun = autoRun;
    OUTPUT_UUID_TO_CODE_UUID.set(this.__outputNodeUuid, codeNodeUuid);
    CODE_UUID_TO_OUTPUT_KEY.set(this.__codeNodeUuid, this.__key);
    CODE_UUID_TO_OUTPUT_UUID.set(this.__codeNodeUuid, this.__outputNodeUuid);
    OUTPUT_UUID_TO_OUTPUT_KEY.set(this.__outputNodeUuid, this.__key);
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

  setOutputNodeUuid(outputNodeUuid: string) {
    const self = this.getWritable();
    self.__outputNodeUuid = outputNodeUuid;
  }

  getOutputNodeUuid(): string {
    const self = this.getLatest();
    return self.__outputNodeUuid;
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
    return <JupyterOutputComponent
      code={this.getCode()}
      outputs={this.__outputs}
      outputAdapter={this.__outputAdapter}
      codeNodeUuid={this.__codeNodeUuid}
      outputNodeUuid={this.__outputNodeUuid}
      executeTrigger={this.getExecuteTrigger()}
      autoRun={this.__autoRun}
      />
  }

  /** @override */
  exportJSON(): SerializedJupyterOutputNode {
    return {
      type: "jupyter-output",
      source: this.getCode(),
      outputs: this.__outputAdapter.outputArea.model.toJSON(),
      codeNodeUuid: this.getCodeNodeUuid(),
      outputNodeUuid: this.getOutputNodeUuid(),
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
    this.setCode(code);
    this.__outputAdapter.execute(code);
//    this.setExecuteTrigger(this.getExecuteTrigger() + 1);
  }

}

export function $createJupyterOutputNode(
  code: string,
  outputAdapter: OutputAdapter,
  outputs: IOutput[],
  autoRun: boolean,
  codeNodeUuid: string,
  outputNodeUuid: string,
  ): JupyterOutputNode {
  return new JupyterOutputNode(
    code,
    outputAdapter,
    outputs,
    autoRun,
    codeNodeUuid,
    outputNodeUuid,
  );
}

export function $isJupyterOutputNode(node: LexicalNode) {
  return node instanceof JupyterOutputNode;
}
