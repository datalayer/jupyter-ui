import { Message } from '@lumino/messaging';
import { DockPanel, BoxPanel, Widget } from '@lumino/widgets';

import '@lumino/default-theme/style/index.css';

import './LuminoAdapter.css'

class SimpleContent extends Widget {

  constructor(name: string) {
    super({ node: SimpleContent.createNode() });
    this.setFlag(Widget.Flag.DisallowLayout);
    this.addClass('content');
    this.addClass(name.toLowerCase());
    this.title.label = name;
    this.title.closable = true;
    this.title.caption = `Long description for: ${name}`;
  }

  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let content = document.createElement('div');
    let input = document.createElement('input');
    input.placeholder = 'Placeholder...';
    content.appendChild(input);
    node.appendChild(content);
    return node;
  }

  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }

  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.inputNode.focus();
    }
  }

}

class SimpleAdapter {
  private simplePanel: BoxPanel;

  constructor() {
    const colors = [
      'Red', 
      'Yellow',
      'Green',
      'Blue'
    ];

    this.simplePanel = new BoxPanel();
    this.simplePanel.id = 'simple-panel';
    // this.simplePanel.direction = 'top-to-bottom';
    this.simplePanel.spacing = 0;

    // Dock Panel
    const r1 = new SimpleContent('Red');
    const b1 = new SimpleContent('Blue');
    const g1 = new SimpleContent('Green');
    const y1 = new SimpleContent('Yellow');
    const r2 = new SimpleContent('Red');
    const b2 = new SimpleContent('Blue');

    const dockPanel = new DockPanel();
    dockPanel.addWidget(r1);
    dockPanel.addWidget(b1, { mode: 'split-right', ref: r1 });
    dockPanel.addWidget(y1, { mode: 'split-bottom', ref: b1 });
    dockPanel.addWidget(g1, { mode: 'split-left', ref: y1 });
    dockPanel.addWidget(r2, { ref: b1 });
    dockPanel.addWidget(b2, { mode: 'split-right', ref: y1 });
    dockPanel.id = 'simple-dock-panel';

    this.simplePanel.addWidget(dockPanel);

    for (let i = 0; i < 20; i++) {
      const c = new SimpleContent(colors[Math.floor(Math.random() * 4)]);
      this.simplePanel.addWidget(c);
    }

  }

  get panel(): BoxPanel {
    return this.simplePanel;
  }

}

export default SimpleAdapter;
