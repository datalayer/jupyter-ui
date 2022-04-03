import { BoxPanel } from '@lumino/widgets';
import { TerminalManager } from '@jupyterlab/services';
import { Terminal, ITerminal } from '@jupyterlab/terminal';

import '@jupyterlab/terminal/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './TerminalAdapter.css';

class TerminalAdapter {
  private terminalPanel: BoxPanel;
  private terminal: Terminal;

  constructor() {
    this.terminalPanel = new BoxPanel();
    this.terminalPanel.id = 'jupyterlab-terminal';
    this.terminalPanel.spacing = 0;
    const manager = new TerminalManager();
    manager.startNew().then((s1) => {
      this.terminal = new Terminal(s1, { theme: 'light' });
      this.terminal.title.closable = true;
      this.terminalPanel.addWidget(this.terminal);
    });
  }

  get panel(): BoxPanel {
    return this.terminalPanel;
  }

  setTheme(theme: string) {
    this.terminal.setOption('theme', theme as ITerminal.Theme);
  }

}

export default TerminalAdapter;
