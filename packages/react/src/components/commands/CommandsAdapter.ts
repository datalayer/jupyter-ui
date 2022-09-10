import { CommandRegistry } from '@lumino/commands';
import { CommandPalette, BoxPanel } from '@lumino/widgets';

import './CommandsAdapter.css';

class CommandsAdapter {
  private commandsPanel: BoxPanel;

  constructor() {
    this.commandsPanel = new BoxPanel();
    this.commandsPanel.id = 'datalayer-jupyter-commands';
    this.commandsPanel.spacing = 0;
    // Initialize the command registry with the key bindings.
    const commands = new CommandRegistry();
    const palette = new CommandPalette({ commands });
    BoxPanel.setStretch(palette, 0);
    this.commandsPanel.addWidget(palette);
    // Handle resize events.
    window.addEventListener('resize', () => {
      this.commandsPanel.update();
    });
    const selector = '.jp-ConsolePanel';
    const category = 'Console';
    const command = 'console:execute';
    commands.addCommand(command, {
      label: 'Execute Cell',
      execute: () => {
        window.alert('Execute Cell')
      }
    });
    palette.addItem({ command, category });
    commands.addKeyBinding({ command, selector, keys: ['Shift Enter'] });
  }

  get panel(): BoxPanel {
    return this.commandsPanel;
  }

}

export default CommandsAdapter;
