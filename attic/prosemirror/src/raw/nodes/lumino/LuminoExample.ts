/*
 * Copyright (c) 2022-2023 Datalayer Inc. All rights reserved.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { Message } from '@lumino/messaging';
import { BoxPanel, DockPanel, Menu, MenuBar, Widget } from '@lumino/widgets';

import './LuminoExample.css';

const commands = new CommandRegistry();

function createMenu(): Menu {
  let sub1 = new Menu({ commands });
  sub1.title.label = 'More...';
  sub1.title.mnemonic = 0;
  sub1.addItem({ command: 'example:one' });
  sub1.addItem({ command: 'example:two' });
  sub1.addItem({ command: 'example:three' });
  sub1.addItem({ command: 'example:four' });

  let sub2 = new Menu({ commands });
  sub2.title.label = 'More...';
  sub2.title.mnemonic = 0;
  sub2.addItem({ command: 'example:one' });
  sub2.addItem({ command: 'example:two' });
  sub2.addItem({ command: 'example:three' });
  sub2.addItem({ command: 'example:four' });
  sub2.addItem({ type: 'submenu', submenu: sub1 });

  let root = new Menu({ commands });
  root.addItem({ command: 'example:copy' });
  root.addItem({ command: 'example:cut' });
  root.addItem({ command: 'example:paste' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:new-tab' });
  root.addItem({ command: 'example:close-tab' });
  root.addItem({ command: 'example:save-on-exit' });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:open-task-manager' });
  root.addItem({ type: 'separator' });
  root.addItem({ type: 'submenu', submenu: sub2 });
  root.addItem({ type: 'separator' });
  root.addItem({ command: 'example:close' });

  return root;
}

class ContentWidget extends Widget {

  constructor(name: string) {
    super({ node: ContentWidget.createNode() });
    this.setFlag(Widget.Flag.DisallowLayout);
    this.addClass('content');
    this.addClass(name.toLowerCase());
    this.title.label = name;
    this.title.closable = true;
    this.title.caption = `Long description for: ${name}`;
  }

  get inputNode(): HTMLInputElement {
    return this.node.getElementsByTagName('input')[0] as HTMLInputElement;
  }

  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      this.inputNode.focus();
    }
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

}

class LuminoExample {
  private _panel: BoxPanel;

  constructor() {

    let menu1 = createMenu();
    menu1.title.label = 'File';
    menu1.title.mnemonic = 0;

    let menu2 = createMenu();
    menu2.title.label = 'Edit';
    menu2.title.mnemonic = 0;

    let menu3 = createMenu();
    menu3.title.label = 'View';
    menu3.title.mnemonic = 0;

    let bar = new MenuBar();
    bar.addMenu(menu1);
    bar.addMenu(menu2);
    bar.addMenu(menu3);
    bar.id = 'menuBar';

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      commands.processKeydownEvent(event);
    });

    let r1 = new ContentWidget('Red');
    let b1 = new ContentWidget('Blue');
    let g1 = new ContentWidget('Green');
    let y1 = new ContentWidget('Yellow');

    let r2 = new ContentWidget('Red');
    let b2 = new ContentWidget('Blue');
    // let g2 = new ContentWidget('Green');
    // let y2 = new ContentWidget('Yellow');

    let dock = new DockPanel();
    dock.addWidget(r1);
    dock.addWidget(b1, { mode: 'split-right', ref: r1 });
    dock.addWidget(y1, { mode: 'split-bottom', ref: b1 });
    dock.addWidget(g1, { mode: 'split-left', ref: y1 });
    dock.addWidget(r2, { ref: b1 });
    dock.addWidget(b2, { mode: 'split-right', ref: y1 });
    dock.id = 'dock';

    BoxPanel.setStretch(dock, 1);
    this._panel = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
    this._panel.addWidget(dock);
  }

  get panel(): BoxPanel {
    return this._panel;
  }

}

export default LuminoExample;
