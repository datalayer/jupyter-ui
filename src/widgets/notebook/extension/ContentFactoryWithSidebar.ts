import { NotebookPanel } from '@jupyterlab/notebook';
import { ICellHeader, Cell } from '@jupyterlab/cells';
import { CommandRegistry } from '@lumino/commands';
import { CellSidebar } from './CellSidebar';
// import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './NotebookInputPrompt';

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class ContentFactoryWithSidebar extends NotebookPanel.ContentFactory {
  private readonly sidebarReact: any;
  private readonly commands: CommandRegistry;
  private readonly injectableStore: any;
  constructor(
    sidebarReact: any,
    commands: CommandRegistry,
    injectableStore: any,
    options?: Cell.ContentFactory.IOptions | undefined
  ) {
    super(options);
    this.sidebarReact = sidebarReact;
    this.commands = commands;
    this.injectableStore = injectableStore;
  }
  createCellHeader(): ICellHeader {
    return new CellSidebar(this.sidebarReact, this.commands, this.injectableStore);
  }
//  createInputPrompt(): IInputPrompt {
//    return new NotebookInputPrompt();
//  }
}

export default ContentFactoryWithSidebar;
