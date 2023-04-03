import { OutputAdapter, loadJupyterConfig, createServerSettings, Kernel } from '@datalayer/jupyter-react';
import { KernelManager } from "@jupyterlab/services";
import { Widget } from '@lumino/widgets';
import { EditorView, NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";

import '@jupyterlab/output/style/base.css';

import "./OutputView.css";

class OutputView implements NodeView {
  public dom: HTMLElement;
  constructor(node: Node, view: EditorView, getPos: () => number) {
    this.dom = document.createElement('div');
    this.dom.classList.add('output');
    document.body.appendChild(this.dom);
    const config = loadJupyterConfig({
      children: [],
      lite: false,
      startDefaultKernel: true,
      defaultKernelName: "python",
    });
    const serverSettings = createServerSettings(
      config.jupyterServerHttpUrl,
      config.jupyterServerWsUrl,
      );
    const kernelManager = new KernelManager({
      serverSettings,
    });
    const kernel = new Kernel({
      kernelManager,
      kernelName: 'python',
    });
    const widget = new OutputAdapter(kernel);
    Widget.attach(widget.outputArea, this.dom);
  }
  selectNode() {
    this.dom.classList.add("ProseMirror-selectednode");
  }
  deselectNode() {
    this.dom.classList.remove("ProseMirror-selectednode");
  }
  ignoreMutation(m: MutationRecord) {
    return true;
  }
  stopEvent(e: Event) {
    return false;
  }
}

export default OutputView;
