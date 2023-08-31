import { Store } from 'redux';
import { CommandRegistry } from '@lumino/commands';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ICellHeader, Cell } from '@jupyterlab/cells';
import { CellSidebarWidget, CellSidebarProps } from '../cell/sidebar/CellSidebarWidget';
// import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './../cell/InputPrompt';

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class JupyterReactContentFactory extends NotebookPanel.ContentFactory {
  private readonly CellSidebar: (props: CellSidebarProps) => JSX.Element;
  private readonly notebookId: string;
  private readonly nbgrader: boolean;
  private readonly commands: CommandRegistry;
  private readonly store: Store;

  constructor(
    CellSidebar: (props: CellSidebarProps) => JSX.Element,
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
    options: Cell.ContentFactory.IOptions,
    store?: Store,
  ) {
    super(options);
    this.CellSidebar = CellSidebar;
    super.createCodeCell
    this.notebookId = notebookId,
    this.nbgrader = nbgrader;
    this.commands = commands;
    this.store = store!;
  }

  /** @override */
  createCellHeader(): ICellHeader {
    return new CellSidebarWidget(
      this.CellSidebar,
      this.notebookId,
      this.nbgrader, 
      this.commands, 
      this.store,
      );
  }
  /*
  createInputPrompt(): IInputPrompt {
    return new InputPrompt();
  }
  */
}

export default JupyterReactContentFactory;
