/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
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
import { deleteCellOperation } from '../operations/deleteCell';
import { updateCellOperation } from '../operations/updateCell';
import { readCellOperation } from '../operations/readCell';
import { readAllCellsOperation } from '../operations/readAllCells';
import { runCellOperation } from '../operations/runCell';
import { executeCodeOperation } from '../operations/executeCode';
import type { ToolExecutor, ToolExecutionContext } from '../core/interfaces';

/**
 * Mock executor for testing
 */
class MockExecutor implements ToolExecutor {
  async execute(operation: string, params: unknown): Promise<unknown> {
    // Mock responses based on operation type
    switch (operation) {
      case 'readAllCells':
        return {
          cells: [
            { type: 'code', source: 'print("hello")', index: 0 },
            { type: 'markdown', source: '# Title', index: 1 },
          ],
        };

      case 'readCell':
        return {
          type: 'code',
          source: 'print("test")',
          index: (params as { index: number }).index,
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

      case 'runCell':
      case 'updateCell':
      case 'deleteCell':
      case 'insertCell':
        return { success: true };

      default:
        return { success: true };
    }
  }
}

describe('OperationRunner', () => {
  let runner: OperationRunner;
  let mockExecutor: ToolExecutor;
  let baseContext: ToolExecutionContext;

  beforeEach(() => {
    runner = new OperationRunner();
    mockExecutor = new MockExecutor();
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
        deleteCellOperation,
        { indices: [2] },
        { ...baseContext, format: 'json' }
      );

      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('deletedCells');
    });

    it('should return TOON string with format=toon', async () => {
      const result = await runner.execute(
        deleteCellOperation,
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
      expect(result).toHaveProperty('index', 1);
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
  });

  describe('Error handling', () => {
    it('should throw error when documentId is missing', async () => {
      await expect(
        runner.execute(
          readCellOperation,
          { index: 0 },
          { executor: mockExecutor } // no documentId
        )
      ).rejects.toThrow();
    });

    it('should throw error when executor is missing', async () => {
      await expect(
        runner.execute(
          readCellOperation,
          { index: 0 },
          { documentId: 'test-123' } as ToolExecutionContext // no executor
        )
      ).rejects.toThrow();
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
