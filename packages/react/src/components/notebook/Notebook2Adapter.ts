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
import { NotebookCommandIds } from './NotebookCommands';

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
    const notebook = this._notebook;

    // If we're in edit mode and have an active cell with an editor,
    // try to undo in the cell editor first
    if (notebook.mode === 'edit' && notebook.activeCell?.editor) {
      const editor = notebook.activeCell.editor;
      // CodeMirror editor has an undo method
      if (editor && typeof (editor as any).undo === 'function') {
        (editor as any).undo();
        return;
      }
    }

    // Otherwise, undo at the notebook level (add/remove cells, etc.)
    NotebookActions.undo(notebook);
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
    const notebook = this._notebook;

    // If we're in edit mode and have an active cell with an editor,
    // try to redo in the cell editor first
    if (notebook.mode === 'edit' && notebook.activeCell?.editor) {
      const editor = notebook.activeCell.editor;
      // CodeMirror editor has a redo method
      if (editor && typeof (editor as any).redo === 'function') {
        (editor as any).redo();
        return;
      }
    }

    // Otherwise, redo at the notebook level (add/remove cells, etc.)
    NotebookActions.redo(notebook);
  }

  /**
   * Set the active cell by index.
   *
   * @param index - The index of the cell to activate (0-based)
   *
   * @remarks
   * This method programmatically selects a cell at the specified index.
   * If the index is out of bounds, the operation has no effect.
   */
  setActiveCell(index: number): void {
    const notebook = this._notebook;
    const cellCount = notebook.model?.cells.length ?? 0;

    if (index >= 0 && index < cellCount) {
      notebook.activeCellIndex = index;
    }
  }

  /**
   * Get all cells from the notebook.
   *
   * @returns Array of cell data including type, source, and outputs
   *
   * @remarks
   * This method extracts cell information from the notebook model.
   * For code cells, outputs are included. Returns an empty array if
   * the notebook model is not available.
   */
  getCells(): Array<{
    type: nbformat.CellType;
    source: string;
    outputs?: unknown[];
  }> {
    const cells = this._notebook.model?.cells;
    if (!cells) {
      return [];
    }

    const result: Array<{
      type: nbformat.CellType;
      source: string;
      outputs?: unknown[];
    }> = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells.get(i);
      if (cell) {
        result.push({
          type: cell.type as nbformat.CellType,
          source: cell.sharedModel.getSource(),
          outputs:
            cell.type === 'code' ? (cell as any).outputs?.toJSON() : undefined,
        });
      }
    }

    return result;
  }

  /**
   * Get the total number of cells in the notebook.
   *
   * @returns The number of cells, or 0 if the notebook model is not available
   */
  getCellCount(): number {
    return this._notebook.model?.cells.length ?? 0;
  }

  /**
   * Insert a new cell at a specific index.
   *
   * @param cellIndex - The index where the cell should be inserted (0-based)
   * @param source - Optional source code/text for the new cell
   *
   * @remarks
   * This method inserts a cell at the specified position by:
   * 1. Setting the active cell to cellIndex
   * 2. Calling insertAbove to insert before that cell
   *
   * Note: The cell type is determined by _defaultCellType, which should be set
   * before calling this method (typically done by the store layer).
   */
  insertAt(cellIndex: number, source?: string): void {
    const cellCount = this.getCellCount();

    console.log('[Notebook2Adapter.insertAt] BEFORE:', {
      cellIndex,
      sourceLength: source?.length || 0,
      sourcePreview: source?.substring(0, 50),
      currentActiveCell: this._notebook.activeCellIndex,
      cellCount,
      defaultCellType: this._defaultCellType,
    });

    // If index is beyond cell count, insert at the end
    if (cellIndex >= cellCount) {
      console.log(
        '[Notebook2Adapter.insertAt] Index beyond cell count, inserting at end'
      );
      this.insertBelow(source);
      return;
    }

    this.setActiveCell(cellIndex);

    console.log('[Notebook2Adapter.insertAt] AFTER setActiveCell:', {
      newActiveCell: this._notebook.activeCellIndex,
    });

    this.insertAbove(source);

    console.log('[Notebook2Adapter.insertAt] AFTER insertAbove:', {
      cellCount: this.getCellCount(),
      newActiveCell: this._notebook.activeCellIndex,
    });
  }

  /**
   * NEW ALIGNED TOOL METHODS
   * These methods align 1:1 with tool operation names for seamless integration
   */

  /**
   * Insert a cell at a specific index (aligned with insertCell tool).
   *
   * @param cellType - Type of cell to insert (code, markdown, or raw)
   * @param cellIndex - Index where to insert (0-based). Use large number for end.
   * @param source - Optional source code/text for the cell
   */
  insertCell(
    cellType: nbformat.CellType,
    cellIndex: number,
    source?: string
  ): void {
    this.setDefaultCellType(cellType);
    this.insertAt(cellIndex, source);
  }

  /**
   * Insert multiple cells at a specific index (aligned with insertCells tool).
   *
   * More efficient than calling insertCell multiple times.
   * Cells are inserted sequentially starting at the given index.
   *
   * @param cells - Array of cells to insert (each with type and source)
   * @param cellIndex - Index where to insert first cell (0-based). Use large number for end.
   */
  insertCells(
    cells: Array<{ type: nbformat.CellType; source: string }>,
    cellIndex: number
  ): void {
    let currentIndex = cellIndex;
    for (const cell of cells) {
      this.setDefaultCellType(cell.type);
      this.insertAt(currentIndex, cell.source);
      currentIndex++;
    }
  }

  /**
   * Delete the currently active cell (aligned with deleteCell tool).
   */
  deleteCell(): void {
    this.deleteCells();
  }

  /**
   * Update a cell's content and/or type (aligned with updateCell tool).
   *
   * @param cellType - New cell type
   * @param source - New source content (optional)
   */
  updateCell(cellType: nbformat.CellType, source?: string): void {
    if (source !== undefined && this._notebook.activeCell) {
      this._notebook.activeCell.model.sharedModel.setSource(source);
    }
    this.changeCellType(cellType);
  }

  /**
   * Get a cell's content by index or active cell (aligned with getCell tool).
   *
   * @param index - Optional cell index (0-based). If not provided, returns active cell.
   * @returns Cell data or undefined if not found
   */
  getCell(
    index?: number
  ):
    | { type: nbformat.CellType; source: string; outputs?: unknown[] }
    | undefined {
    if (index !== undefined) {
      // Get cell at specific index
      const cells = this.getCells();
      return cells[index];
    } else {
      // Get active cell
      const activeCell = this._notebook.activeCell;
      if (!activeCell) return undefined;

      return {
        type: activeCell.model.type,
        source: activeCell.model.sharedModel.getSource(),
        outputs:
          activeCell.model.type === 'code'
            ? (activeCell.model as any).outputs?.toJSON()
            : undefined,
      };
    }
  }

  /**
   * Run the active cell (aligned with runCell tool).
   */
  runCell(): void {
    this._commands.execute(NotebookCommandIds.run);
  }

  /**
   * Run all cells in the notebook (aligned with runAllCells tool).
   */
  runAllCells(): void {
    this._commands.execute(NotebookCommandIds.runAll);
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
