import { Store } from 'redux';
import { CommandRegistry } from '@lumino/commands';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ICellHeader, Cell } from '@jupyterlab/cells';
import { CellSidebarWidget, CellSidebarProps } from './CellSidebarWidget';
// import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './NotebookInputPrompt';

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class CellSidebarContentFactory extends NotebookPanel.ContentFactory {
  private readonly CellSidebar: (props: CellSidebarProps) => JSX.Element;
  private readonly nbgrader: boolean;
  private readonly commands: CommandRegistry;
  private readonly store: Store;
  constructor(
    CellSidebar: (props: CellSidebarProps) => JSX.Element,
    nbgrader: boolean,
    commands: CommandRegistry,
    store?: Store,
    options?: Cell.ContentFactory.IOptions | undefined
  ) {
    super(options);
    this.CellSidebar = CellSidebar;
    this.nbgrader = nbgrader;
    this.commands = commands;
    this.store = store!;
  }
  /** @override */
  createCellHeader(): ICellHeader {
    return new CellSidebarWidget(
      this.CellSidebar,
      this.nbgrader, 
      this.commands, 
      this.store,
      );
  }
  /*
  createInputPrompt(): IInputPrompt {
    return new NotebookInputPrompt();
  }
  */
}

export default CellSidebarContentFactory;
