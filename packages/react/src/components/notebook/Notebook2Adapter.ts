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
import * as Diff from 'diff';

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

    // Always set the cell type to match _defaultCellType
    // (NotebookActions may create cells with a different default type)
    NotebookActions.changeCellType(notebook, this._defaultCellType);

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

    // Always set the cell type to match _defaultCellType
    // (NotebookActions may create cells with a different default type)
    NotebookActions.changeCellType(notebook, this._defaultCellType);

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
    index: number;
    type: nbformat.CellType;
    source: string;
    outputs?: unknown[];
  }> {
    console.log('[Notebook2Adapter.getCells] Called');
    const cells = this._notebook.model?.cells;
    if (!cells) {
      console.log(
        '[Notebook2Adapter.getCells] No cells model, returning empty array'
      );
      return [];
    }

    console.log(`[Notebook2Adapter.getCells] Found ${cells.length} cells`);

    const result: Array<{
      index: number;
      type: nbformat.CellType;
      source: string;
      outputs?: unknown[];
    }> = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells.get(i);
      if (cell) {
        const cellData = {
          index: i,
          type: cell.type as nbformat.CellType,
          source: cell.sharedModel.getSource(),
          outputs:
            cell.type === 'code' ? (cell as any).outputs?.toJSON() : undefined,
        };
        console.log(`[Notebook2Adapter.getCells] Cell ${i}:`, {
          type: cellData.type,
          sourceLength: cellData.source.length,
        });
        result.push(cellData);
      }
    }

    console.log(`[Notebook2Adapter.getCells] Returning ${result.length} cells`);
    return result;
  }

  /**
   * Read all cells from the notebook (alias for getCells).
   *
   * @param format - Response format: 'brief' returns preview only, 'detailed' returns full content
   * @returns Array of cell data - brief or detailed based on format
   *
   * @remarks
   * This method is an alias for getCells() to match the readAllCells tool operation.
   * Provides a consistent naming convention for read operations.
   * Supports brief format (index, type, 40-char preview) and detailed format (full content).
   */
  readAllCells(format: 'brief' | 'detailed' = 'brief'): Array<{
    index: number;
    type: string;
    preview?: string;
    source?: string;
    execution_count?: number | null;
    outputs?: unknown[];
  }> {
    const cells = this.getCells();
    return cells.map((cell, index) => {
      // Get execution count for code cells
      const cellModel = this._notebook.model?.cells.get(index);
      const execution_count =
        cellModel?.type === 'code'
          ? ((cellModel as any).executionCount ?? null)
          : null;

      if (format === 'brief') {
        // Brief format: index, type, 40-char preview
        return {
          index,
          type: cell.type,
          preview: cell.source.substring(0, 40),
        };
      } else {
        // Detailed format: full content with source, execution_count, outputs
        return {
          index,
          type: cell.type,
          source: cell.source,
          execution_count,
          outputs: cell.outputs,
        };
      }
    });
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

    console.log('[Notebook2Adapter.insertAt] Called with:', {
      cellIndex,
      sourceLength: source?.length || 0,
      sourcePreview: source?.substring(0, 50),
      currentActiveCell: this._notebook.activeCellIndex,
      cellCount,
      defaultCellType: this._defaultCellType,
    });

    // Validate cell index is within bounds (matches Jupyter MCP Server)
    if (cellIndex < -1 || cellIndex > cellCount) {
      throw new Error(
        `Index ${cellIndex} is outside valid range [-1, ${cellCount}]. ` +
          `Use -1 to append at end.`
      );
    }

    // Normalize -1 to append position (matches Jupyter MCP Server)
    const actualIndex = cellIndex === -1 ? cellCount : cellIndex;

    console.log('[Notebook2Adapter.insertAt] Normalized index:', {
      originalIndex: cellIndex,
      actualIndex,
      cellCount,
    });

    // Insert at the actual index
    if (actualIndex >= cellCount) {
      // Append at end
      console.log('[Notebook2Adapter.insertAt] Appending at end');
      if (cellCount > 0) {
        this.setActiveCell(cellCount - 1);
      }
      this.insertBelow(source);
    } else {
      // Insert at specific position
      console.log(
        `[Notebook2Adapter.insertAt] Inserting at index ${actualIndex}`
      );
      this.setActiveCell(actualIndex);
      this.insertAbove(source);
    }

    console.log('[Notebook2Adapter.insertAt] After insertion:', {
      cellCount: this.getCellCount(),
      activeCell: this._notebook.activeCellIndex,
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
   * @param cellIndex - Index where to insert (0-based). If undefined, inserts at end.
   * @param source - Optional source code/text for the cell
   */
  insertCell(
    cellType: nbformat.CellType,
    cellIndex?: number,
    source?: string
  ): void {
    this.setDefaultCellType(cellType);
    // Default to cell count (end of notebook) if index not provided
    const targetIndex = cellIndex ?? this.getCellCount();
    this.insertAt(targetIndex, source);
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
   * Delete cell(s) at the specified index/indices (aligned with deleteCell tool and Jupyter MCP Server).
   *
   * @param index - Single cell index, array of indices, or undefined.
   *   - Single number: Deletes that cell
   *   - Array: Deletes all cells at those indices (in reverse order to prevent shifting)
   *   - Undefined: Deletes the active cell if one exists
   *
   * @remarks
   * This method matches the Jupyter MCP Server behavior:
   * - Validates ALL indices are in range before deleting any
   * - Deletes in reverse order (highest to lowest) to prevent index shifting
   * - Throws error with MCP-compatible message format if any index is out of range
   *
   * @throws {Error} If any index is out of range
   */
  deleteCell(index?: number | number[]): void {
    const cells = this._notebook.model?.cells;
    const cellCount = cells?.length ?? 0;

    if (index !== undefined) {
      // Convert single index to array for unified handling
      const indices = Array.isArray(index) ? index : [index];

      // Validate ALL indices first (match Jupyter MCP Server error format)
      for (const idx of indices) {
        if (idx < 0 || idx >= cellCount) {
          console.error(
            `[Notebook2Adapter.deleteCell] Index ${idx} is out of range (cell count: ${cellCount})`
          );
          throw new Error(
            `Cell index ${idx} is out of range. Notebook has ${cellCount} cells.`
          );
        }
      }

      // Sort indices in REVERSE order (highest to lowest) to prevent index shifting
      // This matches the Jupyter MCP Server behavior
      const sortedIndices = [...indices].sort((a, b) => b - a);

      console.log(
        `[Notebook2Adapter.deleteCell] Deleting ${sortedIndices.length} cell(s) in reverse order:`,
        sortedIndices
      );

      // Delete each cell in reverse order
      for (const idx of sortedIndices) {
        this.setActiveCell(idx);
        this.deleteCells();
      }
    } else {
      // No index provided: check if there's an active cell to delete
      const activeCell = this._notebook.activeCell;

      if (!activeCell) {
        console.warn('[Notebook2Adapter.deleteCell] No active cell to delete');
        return; // Safely return without deleting
      }

      // Active cell exists, safe to delete
      this.deleteCells();
    }
  }

  /**
   * Updates cell source at the specified index and returns a diff.
   * Matches MCP server's overwrite_cell_source behavior.
   *
   * @param index - Cell index (0-based)
   * @param source - New cell source content
   * @returns Diff string showing changes made
   * @throws Error if cell index is out of range or cell not found
   */
  updateCell(index: number, source: string): string {
    // Validate cell index
    const cellCount = this._notebook.model?.sharedModel.cells.length ?? 0;

    if (index < 0 || index >= cellCount) {
      throw new Error(
        `Cell index ${index} is out of range. Notebook has ${cellCount} cells.`
      );
    }

    // Get the cell at the specified index
    const cellModel = this._notebook.model?.cells.get(index);
    if (!cellModel) {
      throw new Error(`Cell at index ${index} not found.`);
    }

    // Store old source before updating
    const oldSource = cellModel.sharedModel.getSource();

    // Update the cell source
    cellModel.sharedModel.setSource(source);

    // Generate diff (matches MCP server behavior)
    const patch = Diff.createPatch(
      `cell_${index}`,
      oldSource,
      source,
      'before',
      'after',
      { context: 3 }
    );

    return patch;
  }

  /**
   * Get a cell's content by index or active cell (aligned with getCell tool and MCP Server).
   *
   * @param index - Optional cell index (0-based). If not provided, returns active cell.
   * @param includeOutputs - Whether to include cell outputs (default: true)
   * @returns Cell data or undefined if not found
   */
  getCell(
    index?: number,
    includeOutputs: boolean = true
  ):
    | {
        type: nbformat.CellType;
        source: string;
        execution_count?: number | null;
        outputs?: unknown[];
      }
    | undefined {
    if (index !== undefined) {
      // Get cell at specific index
      const cells = this.getCells();
      const cell = cells[index];
      if (!cell) return undefined;

      // Get execution count for code cells
      const cellModel = this._notebook.model?.cells.get(index);
      const execution_count =
        cellModel?.type === 'code'
          ? ((cellModel as any).executionCount ?? null)
          : null;

      return {
        type: cell.type,
        source: cell.source,
        execution_count,
        outputs: includeOutputs ? cell.outputs : undefined,
      };
    } else {
      // Get active cell
      const activeCell = this._notebook.activeCell;
      if (!activeCell) return undefined;

      const execution_count =
        activeCell.model.type === 'code'
          ? ((activeCell.model as any).executionCount ?? null)
          : null;

      return {
        type: activeCell.model.type,
        source: activeCell.model.sharedModel.getSource(),
        execution_count,
        outputs:
          includeOutputs && activeCell.model.type === 'code'
            ? (activeCell.model as any).outputs?.toJSON()
            : undefined,
      };
    }
  }

  /**
   * Run a cell and optionally capture outputs (aligned with runCell tool).
   *
   * @param params - Parameters for cell execution
   * @param params.index - Cell index to run (optional, defaults to active cell)
   * @param params.timeoutSeconds - Timeout in seconds (optional, for future use)
   * @param params.stream - Enable streaming progress (optional, for future use)
   * @param params.progressInterval - Progress update interval (optional, for future use)
   * @returns Promise resolving to execution result with outputs
   */
  async runCell(params?: {
    index?: number;
    timeoutSeconds?: number;
    stream?: boolean;
    progressInterval?: number;
  }): Promise<{
    execution_count?: number | null;
    outputs?: Array<string>;
  }> {
    const { index } = params || {};
    // Note: timeoutSeconds, stream, progressInterval are accepted for future use
    // but timeout/streaming logic is handled at the operation layer

    // Set active cell if index provided
    if (index !== undefined) {
      this.setActiveCell(index);
    }

    const targetIndex = index ?? this._notebook.activeCellIndex;
    if (targetIndex === -1) {
      throw new Error('No active cell to execute');
    }

    // Execute the cell using JupyterLab's NotebookActions
    await NotebookActions.run(this._notebook, this._context.sessionContext);

    // Wait a brief moment for outputs to be available
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture outputs after execution
    const cellData = this.getCell(targetIndex, true);

    if (!cellData) {
      return {
        execution_count: null,
        outputs: [],
      };
    }

    // Convert outputs to string array (matching MCP format)
    const outputs: Array<string> = [];
    if (cellData.outputs && Array.isArray(cellData.outputs)) {
      for (const output of cellData.outputs) {
        if (typeof output === 'string') {
          outputs.push(output);
        } else if (output && typeof output === 'object') {
          // Handle different output types
          const outputObj = output as Record<string, unknown>;

          if (outputObj.output_type === 'stream') {
            const text = outputObj.text;
            if (typeof text === 'string') {
              outputs.push(text);
            } else if (Array.isArray(text)) {
              outputs.push(text.join(''));
            }
          } else if (
            outputObj.output_type === 'execute_result' ||
            outputObj.output_type === 'display_data'
          ) {
            const data = outputObj.data as Record<string, unknown> | undefined;
            if (data) {
              // Prefer text/plain output
              if (data['text/plain']) {
                const text = data['text/plain'];
                if (typeof text === 'string') {
                  outputs.push(text);
                } else if (Array.isArray(text)) {
                  outputs.push(text.join(''));
                }
              }
            }
          } else if (outputObj.output_type === 'error') {
            // Format error output
            const ename = outputObj.ename ?? 'Error';
            const evalue = outputObj.evalue ?? '';
            const traceback = outputObj.traceback;
            if (Array.isArray(traceback) && traceback.length > 0) {
              outputs.push(
                `[ERROR: ${ename}: ${evalue}]\n${traceback.join('\n')}`
              );
            } else {
              outputs.push(`[ERROR: ${ename}: ${evalue}]`);
            }
          }
        }
      }
    }

    return {
      execution_count: cellData.execution_count,
      outputs,
    };
  }

  /**
   * Run all cells in the notebook (aligned with runAllCells tool).
   */
  runAllCells(): void {
    this._commands.execute(NotebookCommandIds.runAll);
  }

  /**
   * Clear all outputs from all cells in the notebook.
   *
   * @remarks
   * Removes all execution outputs from all cells. This operation:
   * - Clears outputs but preserves cell source code
   * - Resets execution counts
   * - Cannot be undone
   */
  clearAllOutputs(): void {
    NotebookActions.clearAllOutputs(this._notebook);
  }

  /**
   * Execute code directly in the kernel without creating a cell.
   *
   * This method sends code execution requests directly to the kernel,
   * bypassing the notebook cell model. Useful for:
   * - Variable inspection
   * - Environment setup
   * - Background tasks
   * - Tool introspection
   *
   * @param code - Code to execute
   * @param options - Execution options
   * @returns Promise with execution result including outputs
   */
  async executeCode(
    code: string,
    options: {
      timeout?: number;
    } = {}
  ): Promise<{
    success: boolean;
    outputs?: Array<{
      type: 'stream' | 'execute_result' | 'display_data' | 'error';
      content: unknown;
    }>;
    executionCount?: number;
    error?: string;
  }> {
    const sessionContext = this._panel.sessionContext;

    if (!sessionContext || !sessionContext.session?.kernel) {
      return {
        success: false,
        error: 'No active kernel session',
      };
    }

    const kernel = sessionContext.session.kernel;

    try {
      const future = kernel.requestExecute({
        code,
        stop_on_error: true, // Internal default: stop on error
        store_history: false, // Internal default: don't store in history
        silent: false, // Internal default: not silent (show outputs)
        allow_stdin: false,
      });

      const outputs: Array<{
        type: 'stream' | 'execute_result' | 'display_data' | 'error';
        content: unknown;
      }> = [];

      let executionCount: number | undefined;

      // Collect outputs
      future.onIOPub = msg => {
        const msgType = msg.header.msg_type;

        if (msgType === 'stream') {
          outputs.push({
            type: 'stream',
            content: msg.content,
          });
        } else if (msgType === 'execute_result') {
          outputs.push({
            type: 'execute_result',
            content: msg.content,
          });
          executionCount = (msg.content as any).execution_count;
        } else if (msgType === 'display_data') {
          outputs.push({
            type: 'display_data',
            content: msg.content,
          });
        } else if (msgType === 'error') {
          outputs.push({
            type: 'error',
            content: msg.content,
          });
        }
      };

      // Handle timeout if specified (default: 30 seconds, max: 60)
      const timeoutMs = (options.timeout ?? 30) * 1000;

      const executionPromise = future.done;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(
            new Error(
              `Execution timeout after ${options.timeout ?? 30} seconds`
            )
          );
        }, timeoutMs);
      });

      try {
        await Promise.race([executionPromise, timeoutPromise]);
      } catch (timeoutError) {
        // Interrupt kernel on timeout
        try {
          await kernel.interrupt();
        } catch (interruptError) {
          console.error('Failed to interrupt kernel:', interruptError);
        }

        return {
          success: false,
          error: `Execution exceeded ${options.timeout ?? 30} seconds and was interrupted`,
          outputs,
        };
      }

      return {
        success: true,
        outputs,
        executionCount,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
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
