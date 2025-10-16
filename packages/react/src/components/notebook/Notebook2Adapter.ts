/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { CommandRegistry } from '@lumino/commands';
import {
  NotebookPanel,
  NotebookActions,
  type Notebook,
} from '@jupyterlab/notebook';
import { Context } from '@jupyterlab/docregistry';
import { NotebookModel } from '@jupyterlab/notebook';
import * as nbformat from '@jupyterlab/nbformat';

export class Notebook2Adapter {
  private _commands: CommandRegistry;
  private _panel: NotebookPanel;
  private _notebook: Notebook;
  private _context: Context<NotebookModel>;
  private _defaultCellType: nbformat.CellType = 'code';

  constructor(
    commands: CommandRegistry,
    panel: NotebookPanel,
    context: Context<NotebookModel>
  ) {
    this._commands = commands;
    this._panel = panel;
    this._notebook = panel.content;
    this._context = context;
  }

  /**
   * Get the command registry.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * Get the notebook panel.
   */
  get panel(): NotebookPanel {
    return this._panel;
  }

  /**
   * Get the notebook widget.
   */
  get notebook(): Notebook {
    return this._notebook;
  }

  /**
   * Get the notebook context.
   */
  get context(): Context<NotebookModel> {
    return this._context;
  }

  /**
   * Set the default cell type for new cells.
   */
  setDefaultCellType(cellType: nbformat.CellType): void {
    this._defaultCellType = cellType;
  }

  /**
   * Get the default cell type for new cells.
   */
  get defaultCellType(): nbformat.CellType {
    return this._defaultCellType;
  }

  /**
   * Insert a new cell above the active cell.
   */
  insertAbove(source?: string): void {
    const notebook = this._notebook;

    // Insert above using NotebookActions
    NotebookActions.insertAbove(notebook);

    // Set the cell type if different from default
    if (this._defaultCellType !== 'code') {
      NotebookActions.changeCellType(notebook, this._defaultCellType);
    }

    // Set the source if provided
    if (source && notebook.activeCell) {
      notebook.activeCell.model.sharedModel.setSource(source);
    }

    // Enter edit mode
    notebook.mode = 'edit';
  }

  /**
   * Insert a new cell below the active cell.
   */
  insertBelow(source?: string): void {
    const notebook = this._notebook;

    // Insert below using NotebookActions
    NotebookActions.insertBelow(notebook);

    // Set the cell type if different from default
    if (this._defaultCellType !== 'code') {
      NotebookActions.changeCellType(notebook, this._defaultCellType);
    }

    // Set the source if provided
    if (source && notebook.activeCell) {
      notebook.activeCell.model.sharedModel.setSource(source);
    }

    // Enter edit mode
    notebook.mode = 'edit';
  }

  /**
   * Change the type of the active cell.
   */
  changeCellType(cellType: nbformat.CellType): void {
    const notebook = this._notebook;

    if (notebook.activeCell && notebook.activeCell.model.type !== cellType) {
      NotebookActions.changeCellType(notebook, cellType);
    }
  }

  /**
   * Delete the currently selected cells.
   */
  deleteCells(): void {
    const notebook = this._notebook;
    NotebookActions.deleteCells(notebook);
  }

  /**
   * Get the notebook model.
   */
  get model(): NotebookModel | null {
    return this._context.model;
  }

  /**
   * Undo the last change in the notebook.
   *
   * @remarks
   * If there is no history to undo (e.g., at the beginning of the undo stack),
   * this operation will have no effect. The notebook must be available and
   * properly initialized for this operation to succeed.
   */
  undo(): void {
    NotebookActions.undo(this._notebook);
  }

  /**
   * Redo the last undone change in the notebook.
   *
   * @remarks
   * If there is no history to redo (e.g., no prior undo operations or at the
   * end of the redo stack), this operation will have no effect. The notebook
   * must be available and properly initialized for this operation to succeed.
   */
  redo(): void {
    NotebookActions.redo(this._notebook);
  }

  /**
   * Dispose of the adapter.
   */
  dispose(): void {
    // Clean up any resources if needed
    // The panel, notebook, and context are managed by Notebook2Base
  }
}

export default Notebook2Adapter;
