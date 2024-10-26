/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import { Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { ICellHeader, Cell } from '@jupyterlab/cells';
import { CellSidebarWidget, ICellSidebarProps } from '../cell/sidebar/CellSidebarWidget';
import { CodeCell } from '@jupyterlab/cells';
import { CodeEditor } from '@jupyterlab/codeeditor';
// import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import { IInputPrompt } from '@jupyterlab/cells';
// import { NotebookInputPrompt } from './../cell/InputPrompt';

class DatalayerCodeCell extends CodeCell {
  constructor(options: CodeCell.IOptions) {
    super(options);
  }
}

/**
 * Extend the default implementation NotebookPanel.ContentFactory of `IContentFactory`.
 */
export class JupyterReactContentFactory extends NotebookPanel.ContentFactory {
  private readonly CellSidebar?: (props: ICellSidebarProps) => JSX.Element;
  private readonly notebookId: string;
  private readonly nbgrader: boolean;
  private readonly commands: CommandRegistry;

  constructor(
    notebookId: string,
    nbgrader: boolean,
    commands: CommandRegistry,
    options: Cell.ContentFactory.IOptions,
    CellSidebar?: (props: ICellSidebarProps) => JSX.Element,
  ) {
    super(options);
    this.CellSidebar = CellSidebar;
    this.notebookId = notebookId;
    this.nbgrader = nbgrader;
    this.commands = commands;
  }

  private _updateSQLEditor = (cell: CodeCell) => {
    const datalayer = cell.model?.getMetadata('datalayer');
    if (datalayer && datalayer['sql']) {
      (cell.editor!.model as CodeEditor.Model).mimeType = 'application/sql';
    }
  }

  private _updateEditor = (cell: CodeCell) => {
    if (cell.editor) {
      cell.editor.model.mimeTypeChanged.connect((_, args) => {
        this._updateSQLEditor(cell);
      });
      this._updateSQLEditor(cell);
    }
  }

  /** @override */
  createNotebook(options: Notebook.IOptions): Notebook {
    const notebook = super.createNotebook(options);
    return notebook;
  }


  /** @override */
  createCellHeader(): ICellHeader {
    if (this.CellSidebar) {
      return new CellSidebarWidget(
        this.CellSidebar,
        this.notebookId,
        this.nbgrader,
        this.commands,
      );  
    }
    return super.createCellHeader();
  }

  /** @override */
  createCodeCell(options: CodeCell.IOptions): CodeCell {
    const cell = new DatalayerCodeCell(options);
    if (cell.inViewport) {
      this._updateEditor(cell);
    }
    cell.displayChanged.connect(() => {
      this._updateEditor(cell);
    });
    cell.inViewportChanged.connect(() => {
      this._updateEditor(cell);
    });
    return cell;
  }

  /** @override */
  createInputPrompt(): IInputPrompt {
//    return new InputPrompt();
    return super.createInputPrompt();
  }

}

export default JupyterReactContentFactory;
