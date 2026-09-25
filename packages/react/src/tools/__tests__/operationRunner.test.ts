/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tests for OperationRunner with core operations.
 *
 * Verifies that:
 * 1. Operations return pure typed data
 * 2. OperationRunner correctly formats results based on context.format
 * 3. JSON format returns structured objects
 * 4. TOON format returns encoded strings
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OperationRunner } from '../core/operationRunner';
import { insertCellOperation } from '../operations/insertCell';
import { deleteCellsOperation } from '../operations/deleteCells';
import { updateCellOperation } from '../operations/updateCell';
import { readCellOperation } from '../operations/readCell';
import { readAllCellsOperation } from '../operations/readAllCells';
import { runCellOperation } from '../operations/runCell';
import { executeCodeOperation } from '../operations/executeCode';
import { DefaultExecutor } from '../core/executor';
import { notebookToolOperations } from '../index';
import type {
  ToolExecutor,
  ToolExecutionContext,
  ToolOperation,
} from '../core/interfaces';

/**
 * A notebook, near enough.
 *
 * The previous stand-in was a lookup table: `readAllCells` handed back the
 * same two cells whatever had happened, and `insertCell` answered
 * `{success: true}` without inserting anything. That is not a notebook, and
 * one of the operations noticed — `insertCell` verifies its own work by
 * counting cells before and after, so against a table that never changes it
 * concluded, correctly, that nothing had been inserted.
 *
 * This one holds cells and edits them. It is the smallest thing that makes
 * the operations' verification steps mean something, and it is what the
 * platform adapters actually do: `NotebookState.readAllCells` answers with an
 * array, and `updateCell` answers with a diff.
 */
class FakeNotebookExecutor implements ToolExecutor {
  cells: Array<{ type: string; source: string }> = [
    { type: 'code', source: 'print("hello")' },
    { type: 'markdown', source: '# Title' },
    { type: 'code', source: 'x = 1' },
  ];

  /** Every call made, so a test can check what an operation did. */
  readonly calls: Array<{ operation: string; params: unknown }> = [];

  async execute(operation: string, params: unknown): Promise<unknown> {
    this.calls.push({ operation, params });
    const args = (params ?? {}) as Record<string, any>;

    switch (operation) {
      case 'readAllCells':
        // An array, which is what the store answers with — not a wrapper
        // object. `insertCell` and `readAllCells` both count it directly.
        return this.cells.map((cell, index) => ({
          index,
          type: cell.type,
          source: cell.source,
        }));

      case 'readCell': {
        const cell = this.cells[args.index];
        if (!cell) {
          throw new Error(`Cell index ${args.index} is out of range.`);
        }
        return { type: cell.type, source: cell.source, index: args.index };
      }

      case 'insertCell': {
        const at = args.index ?? this.cells.length;
        this.cells.splice(at, 0, {
          type: args.type ?? 'code',
          source: args.source ?? '',
        });
        return { success: true };
      }

      case 'updateCell': {
        const cell = this.cells[args.index];
        if (!cell) {
          throw new Error(`Cell index ${args.index} is out of range.`);
        }
        const before = cell.source;
        cell.source = args.source;
        // A diff string, which is what `NotebookAdapter.updateCell` returns
        // and what the tool renders back to whoever asked for the edit.
        return `- ${before}\n+ ${cell.source}`;
      }

      case 'deleteCells': {
        const indices = [...((args.indices as number[]) ?? [])].sort(
          (a, b) => b - a
        );
        for (const index of indices) {
          this.cells.splice(index, 1);
        }
        return { success: true };
      }

      case 'runCell':
        return {
          success: true,
          index: args.index,
          execution_count: 1,
          outputs: [],
        };

      case 'executeCode':
        return {
          success: true,
          outputs: [
            {
              type: 'stream',
              content: { name: 'stdout', text: 'Hello from code execution' },
            },
          ],
          executionCount: 1,
        };

      default:
        return { success: true };
    }
  }
}

describe('OperationRunner', () => {
  let runner: OperationRunner;
  let mockExecutor: FakeNotebookExecutor;
  let baseContext: ToolExecutionContext;

  beforeEach(() => {
    runner = new OperationRunner();
    mockExecutor = new FakeNotebookExecutor();
    baseContext = {
      executor: mockExecutor,
      documentId: 'test-notebook-123',
    };
  });

  describe('insertCell operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        insertCellOperation,
        { type: 'code', source: 'print("hello")' },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('index');
      expect(result).toHaveProperty('message');
      // The operation verifies its own work by counting cells; check that
      // the work was real and not just reported.
      expect(mockExecutor.cells).toHaveLength(4);
      expect(mockExecutor.cells[3].source).toBe('print("hello")');
    });

    it('reports failure when the cell did not actually arrive', async () => {
      // An adapter that accepts the call and inserts nothing is the case the
      // count check exists for. It must not be reported as success.
      mockExecutor.execute = async (operation: string) =>
        operation === 'readAllCells' ? [] : { success: true };

      const result: any = await runner.execute(
        insertCellOperation,
        { type: 'code', source: 'print("hello")' },
        { ...baseContext, format: 'json' }
      );

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not added/);
    });

    it('should return TOON string with format=toon', async () => {
      const result = await runner.execute(
        insertCellOperation,
        { type: 'code', source: 'print("hello")' },
        { ...baseContext, format: 'toon' }
      );

      expect(typeof result).toBe('string');
      // TOON format should contain structured markers
      expect(result).toContain('success');
    });

    it('should default to TOON format when format is undefined', async () => {
      const result = await runner.execute(
        insertCellOperation,
        { type: 'code', source: 'print("hello")' },
        baseContext // no format specified
      );

      expect(typeof result).toBe('string');
    });
  });

  describe('deleteCell operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        deleteCellsOperation,
        { indices: [2] },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('deletedCells');
    });

    it('should return TOON string with format=toon', async () => {
      const result = await runner.execute(
        deleteCellsOperation,
        { indices: [2] },
        { ...baseContext, format: 'toon' }
      );

      expect(typeof result).toBe('string');
    });
  });

  describe('updateCell operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        updateCellOperation,
        { index: 1, source: 'print("updated")' },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      // No `index`: an update answers with what changed, not with where.
      expect(result).not.toHaveProperty('index');
      expect(mockExecutor.cells[1].source).toBe('print("updated")');
    });

    it('shows what changed, rather than only that something did', async () => {
      /*
       * The diff is the whole value of the message: "overwritten
       * successfully" on its own is not something a reader can check. It
       * travels adapter → store → operation, and the store used to drop it —
       * so every edit reported "no changes detected" however much it had
       * changed.
       */
      const result: any = await runner.execute(
        updateCellOperation,
        { index: 1, source: 'print("updated")' },
        { ...baseContext, format: 'json' }
      );

      expect(result.diff).toBe('- # Title\n+ print("updated")');
      expect(result.message).toContain('# Title');
      expect(result.message).not.toContain('no changes detected');
      expect(result.message).not.toContain('[object Object]');
    });
  });

  describe('readCell operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        readCellOperation,
        { index: 0 },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('source');
    });
  });

  describe('readAllCells operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        readAllCellsOperation,
        {},
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('cells');
      expect(result).toHaveProperty('cellCount');
    });

    it('should return TOON string with format=toon', async () => {
      const result = await runner.execute(
        readAllCellsOperation,
        {},
        { ...baseContext, format: 'toon' }
      );

      expect(typeof result).toBe('string');
      expect(result).toContain('cells');
    });
  });

  describe('runCell operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        runCellOperation,
        { index: 0 },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('index', 0);
    });
  });

  describe('executeCode operation', () => {
    it('should return structured data with format=json', async () => {
      const result = await runner.execute(
        executeCodeOperation,
        { code: 'print("test")' },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('outputs');
      expect(result).toHaveProperty('executionCount');
    });

    it('should return TOON string with format=toon', async () => {
      const result = await runner.execute(
        executeCodeOperation,
        { code: 'print("test")' },
        { ...baseContext, format: 'toon' }
      );

      expect(typeof result).toBe('string');
      expect(result).toContain('success');
    });

    /*
     * The operation was renamed for the agent (`executeCodeInNotebook`);
     * the notebook store's method was not. Run the real executor against a
     * store that, like the real one, only has `executeCode`.
     */
    it('reaches the store method, executeCode, through the DefaultExecutor', async () => {
      const calls: unknown[] = [];
      const store = {
        executeCode: async (payload: unknown) => {
          calls.push(payload);
          return { success: true, outputs: [] };
        },
      };
      const executor = new DefaultExecutor('nb-1', store as never);
      const result = await runner.execute(
        executeCodeOperation,
        { code: '1 + 1' },
        { executor, documentId: 'nb-1', format: 'json' }
      );
      expect(result).toHaveProperty('success', true);
      expect(calls).toEqual([{ id: 'nb-1', code: '1 + 1' }]);
    });

    it('still answers to its former operation name', () => {
      expect(notebookToolOperations.executeCode).toBe(executeCodeOperation);
      expect(notebookToolOperations.executeCodeInNotebook).toBe(
        executeCodeOperation
      );
    });
  });

  describe('Error handling', () => {
    /*
     * A missing document is reported two different ways, depending on which
     * operation was called: the readers answer with `{success: false, error}`
     * and the writers throw. That split is not a rule anybody wrote down —
     * `runCell` and `executeCode` are on the soft side despite not being
     * readers — so it is pinned here rather than assumed. Unifying it is a
     * change to what every agent sees at runtime, and this test is what would
     * have to be rewritten deliberately to make it.
     */
    // Typed loosely, and mutably: `it.each` will not take a readonly table.
    type Case = [string, ToolOperation<any, any>, unknown];

    const SOFT: Case[] = [
      ['readCell', readCellOperation, { index: 0 }],
      ['readAllCells', readAllCellsOperation, {}],
      ['runCell', runCellOperation, { index: 0 }],
      ['executeCode', executeCodeOperation, { code: 'print(1)' }],
    ];

    const HARD: Case[] = [
      ['insertCell', insertCellOperation, { type: 'code', source: 'x' }],
      ['updateCell', updateCellOperation, { index: 0, source: 'x' }],
      ['deleteCells', deleteCellsOperation, { indices: [0] }],
    ];

    it.each(SOFT)(
      '%s answers with a failure result when there is no document',
      async (_name, operation, params) => {
        const result: any = await runner.execute(
          operation,
          params,
          { executor: mockExecutor, format: 'json' } // no documentId
        );

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Document ID is required/);
      }
    );

    it.each(HARD)(
      '%s throws when there is no document',
      async (_name, operation, params) => {
        await expect(
          runner.execute(operation, params, {
            executor: mockExecutor,
            format: 'json',
          })
        ).rejects.toThrow(/Document ID is required/);
      }
    );

    it('should throw error when executor is missing', async () => {
      await expect(
        runner.execute(
          readCellOperation,
          { index: 0 },
          { documentId: 'test-123' } as ToolExecutionContext // no executor
        )
      ).rejects.toThrow();
    });

    it('lets an adapter failure reach the caller, named', async () => {
      // An out-of-range index is the adapter's to refuse, and the operation
      // has to pass that on rather than swallow it into a false success.
      await expect(
        runner.execute(
          updateCellOperation,
          { index: 99, source: 'x' },
          baseContext
        )
      ).rejects.toThrow(/out of range/);
    });

    it('should throw error with invalid params', async () => {
      await expect(
        runner.execute(
          insertCellOperation,
          { invalid: 'params' } as unknown, // missing required fields
          baseContext
        )
      ).rejects.toThrow(/Invalid parameters/);
    });
  });

  describe('Type safety verification', () => {
    it('should preserve operation result types with JSON format', async () => {
      const result = await runner.execute(
        readAllCellsOperation,
        {},
        { ...baseContext, format: 'json' }
      );

      // TypeScript should infer this as ReadAllCellsResult
      if (typeof result === 'object') {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('cells');
        expect(result).toHaveProperty('cellCount');
      }
    });

    it('should return string type with TOON format', async () => {
      const result = await runner.execute(
        readAllCellsOperation,
        {},
        { ...baseContext, format: 'toon' }
      );

      // TypeScript should allow string type
      expect(typeof result).toBe('string');
    });
  });
});
