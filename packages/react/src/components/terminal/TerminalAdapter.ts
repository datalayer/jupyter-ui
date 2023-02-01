import { BoxPanel } from '@lumino/widgets';
import { TerminalManager } from '@jupyterlab/services';
import { Terminal, ITerminal } from '@jupyterlab/terminal';

import './TerminalAdapter.css';

export class TerminalAdapter {
  private terminalPanel: BoxPanel;
  private terminal: Terminal;

  constructor() {
    this.terminalPanel = new BoxPanel();
    this.terminalPanel.addClass('dla-JupyterLab-terminal');
    this.terminalPanel.spacing = 0;
    const manager = new TerminalManager();
    manager.startNew().then((terminalConnection) => {
      this.terminal = new Terminal(terminalConnection, { theme: 'light' });
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

export default TerminalAdapter;
