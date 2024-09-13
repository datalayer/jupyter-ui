/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ICellHeader, Cell } from '@jupyterlab/cells';
import { CellSidebarWidget, ICellSidebarProps } from '../cell/sidebar/CellSidebarWidget';
// import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './../cell/InputPrompt';

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class JupyterReactContentFactory extends NotebookPanel.ContentFactory {
  private readonly CellSidebar: (props: ICellSidebarProps) => JSX.Element;
  private readonly notebookId: string;
  private readonly nbgrader: boolean;
  private readonly commands: CommandRegistry;

  constructor(
    CellSidebar: (props: ICellSidebarProps) => JSX.Element,
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
    options: Cell.ContentFactory.IOptions,
  ) {
    super(options);
    this.CellSidebar = CellSidebar;
    super.createCodeCell;
    (this.notebookId = notebookId), (this.nbgrader = nbgrader);
    this.commands = commands;
  }

  /** @override */
  createCellHeader(): ICellHeader {
    return new CellSidebarWidget(
      this.CellSidebar,
      this.notebookId,
      this.nbgrader,
      this.commands,
    );
  }
  /*
  createInputPrompt(): IInputPrompt {
    return new InputPrompt();
  }
  */
}

export default JupyterReactContentFactory;
