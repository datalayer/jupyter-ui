import { BoxPanel } from '@lumino/widgets';
import { TerminalManager, ServerConnection } from '@jupyterlab/services';
import { Terminal, ITerminal } from '@jupyterlab/terminal';

import './TerminalAdapter.css';

export class TerminalAdapter {
  private terminalPanel: BoxPanel;
  private terminal: Terminal;

  constructor(serverSettings: ServerConnection.ISettings) {
    this.terminalPanel = new BoxPanel();
    this.terminalPanel.addClass('dla-JupyterLab-terminal');
    this.terminalPanel.spacing = 0;
    const terminalManager = new TerminalManager({
      serverSettings,
    });
    terminalManager.startNew().then((terminalConnection) => {
      terminalConnection.connectionStatusChanged.connect((_, status) => {
        console.log('Jupyter Terminal status', status);
      });
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
