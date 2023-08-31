import { EditorView, NodeView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { Widget } from '@lumino/widgets';
import { loadJupyterConfig, createServerSettings, CellAdapter, Kernel } from '@datalayer/jupyter-react';

import '@jupyterlab/cells/style/base.css';

import "./CellView.css"

class CellView implements NodeView {
  public dom: HTMLElement;
  constructor(node: Node, view: EditorView, kernel: Kernel, getPos: () => number) {
    this.dom = document.createElement('div');
    this.dom.classList.add('cell');
    document.body.appendChild(this.dom);
    const config = loadJupyterConfig({
      children: [],
      lite: false,
      startDefaultKernel: true,
      defaultKernelName: "python",
    });
    const serverSettings = createServerSettings(config.jupyterServerHttpUrl, config.jupyterServerWsUrl);
    const widget = new CellAdapter({
      source: "print('hello')",
      serverSettings,
      kernel,
    });
    Widget.attach(widget.panel, this.dom);
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

export default CellView;
