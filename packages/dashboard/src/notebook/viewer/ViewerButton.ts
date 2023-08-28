import { CommandRegistry } from '@lumino/commands';
import { IDisposable } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import icon from '@datalayer/icons-react/data2/EyesIconLabIcon';
import { CommandIDs } from './plugin';

class ViewerButton implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  private _commands: CommandRegistry;

  constructor(commands: CommandRegistry) {
    this._commands = commands;
  }

  createNew(panel: NotebookPanel): IDisposable {
    const button = new ToolbarButton({
      className: 'viewerRender',
      tooltip: 'Viewer',
      icon,
      onClick: () => { this._commands.execute(CommandIDs.viewerRender); }
    });
    panel.toolbar.insertAfter('classicRender', 'viewer', button);
    return button;
  }

}

export default ViewerButton;
