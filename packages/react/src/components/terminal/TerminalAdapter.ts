/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BoxPanel } from '@lumino/widgets';
import { TerminalManager, ServerConnection } from '@jupyterlab/services';
import { Terminal as JupyterTerminal, ITerminal } from '@jupyterlab/terminal';
import { Terminal } from './Terminal';

export class TerminalAdapter {
  private terminal: JupyterTerminal;
  private terminalPanel: BoxPanel;

  constructor(options: TerminalAdapter.ITerminalAdapterOptions) {
    const { serverSettings, colorMode, initCode } = options;
    this.terminalPanel = new BoxPanel();
    this.terminalPanel.spacing = 0;
    this.terminalPanel.addClass('dla-JupyterLab-Terminal-id');
    const terminalManager = new TerminalManager({
      serverSettings,
    });
    terminalManager.startNew().then(async terminalConnection => {
      terminalConnection.connectionStatusChanged.connect((_, status) => {
        console.log('Jupyter Terminal status', status);
      });
      this.terminal = new JupyterTerminal(terminalConnection, {
        theme: colorMode,
      });
      if (initCode) {
        await this.terminal.ready;
        this.terminal.session.send({
          type: 'stdin',
          content: [initCode],
        });
      }
      this.terminal.title.closable = true;
      this.terminalPanel.addWidget(this.terminal);
    });
  }

  get panel(): BoxPanel {
    return this.terminalPanel;
  }

  setTheme(theme: ITerminal.Theme) {
    this.terminal.setOption('theme', theme);
  }
}

export namespace TerminalAdapter {
  export interface ITerminalAdapterOptions extends Terminal.ITerminalOptions {
    serverSettings: ServerConnection.ISettings;
  }
}

export default TerminalAdapter;
