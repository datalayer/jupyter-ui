/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zustand state management for Lexical editors.
 *
 * Mirrors Notebook2State pattern for consistency across the codebase.
 * Provides centralized state management for multiple Lexical documents.
 *
 * @module tools/state/LexicalState
 */

import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { LexicalAdapter, type OperationResult } from './LexicalAdapter';
import type {
  LexicalBlock,
  BlockFormat,
  BriefBlock,
} from '../tools/core/types';

/**
 * State for a single Lexical document
 */
export type ILexicalState = {
  adapter?: LexicalAdapter;
};

/**
 * Root state containing all Lexical documents
 */
export interface ILexicalsState {
  lexicals: Map<string, ILexicalState>;
}

/**
 * Mutation types for tool operations
 * These align with the tool operation parameters
 */

export type InsertBlockMutation = {
  id: string; // lexical document ID
  type: string;
  source: string;
  metadata?: Record<string, unknown>;
  afterId: string;
};

export type InsertBlocksMutation = {
  id: string;
  blocks: Array<{
    type: string;
    source: string;
    metadata?: Record<string, unknown>;
  }>;
  afterId: string;
};

export type UpdateBlockMutation = {
  id: string;
  blockId: string;
  type?: string;
  source?: string;
  metadata?: Record<string, unknown>;
};

export type DeleteBlockMutation = {
  id: string;
  blockId: string;
};

export type ReadBlockMutation = {
  id: string;
  blockId: string;
};

/**
 * Full Lexical state interface with all methods
 */
export type LexicalState = ILexicalsState & {
  // Core state methods
  setLexicals: (lexicals: Map<string, ILexicalState>) => void;
  selectLexical: (id: string) => ILexicalState | undefined;
  selectLexicalAdapter: (id: string) => LexicalAdapter | undefined;

  // Tool-aligned operations - use individual parameters (matches notebook pattern)
  insertBlock: (
    id: string,
    type?: string,
    source?: string,
    metadata?: Record<string, unknown>,
    afterId?: string,
  ) => Promise<OperationResult>;
  updateBlock: (
    id: string,
    blockId?: string,
    type?: string,
    source?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  deleteBlock: (id: string, blockId?: string) => Promise<void>;
  deleteBlocks: (
    id: string,
    blockIds?: string[],
  ) => Promise<{ success: boolean; deletedBlocks?: Array<{ id: string }> }>;
  readBlock: (id: string, blockId?: string) => Promise<LexicalBlock | null>;
  readAllBlocks: (
    id: string,
    format?: BlockFormat,
  ) => Promise<LexicalBlock[] | BriefBlock[]>;
  runBlock: (id: string, blockId?: string) => Promise<any>;
  runAllBlocks: (id: string) => Promise<any>;
  executeCode: (
    id: string,
    code?: string,
    storeHistory?: boolean,
    silent?: boolean,
    stopOnError?: boolean,
  ) => Promise<any>;
  clearAllOutputs: (id: string) => Promise<OperationResult>;
  restartKernel: (id: string) => Promise<OperationResult>;

  // Additional utility methods
  getBlockCount: (id: string) => Promise<number>;
  listAvailableBlocks: (id: string) => Promise<{
    success: boolean;
    types?: any[];
    count?: number;
    error?: string;
  }>;
  reset: () => void;
};

/**
 * Create the Lexical store with Zustand
 */
export const lexicalStore = createStore<LexicalState>((set, get) => ({
  lexicals: new Map<string, ILexicalState>(),

  setLexicals: (lexicals: Map<string, ILexicalState>) =>
    set(() => ({ lexicals })),

  selectLexical: (id: string): ILexicalState | undefined => {
    return get().lexicals.get(id);
  },

  selectLexicalAdapter: (id: string): LexicalAdapter | undefined => {
    return get().lexicals.get(id)?.adapter;
  },

  // Tool operations - thin wrappers delegating to adapter
  insertBlock: async (
    id: string,
    type?: string,
    source?: string,
    metadata?: Record<string, unknown>,
    afterId?: string,
  ): Promise<OperationResult> => {
    // Accept object from executor, destructure it
    const params =
      typeof id === 'object'
        ? (id as any)
        : { id, type, source, metadata, afterId };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    const block: LexicalBlock = {
      block_id: '', // Will be assigned by editor
      block_type: params.type,
      source: params.source,
      metadata: params.metadata,
    };

    const result = await adapter.insertBlock(block, params.afterId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to insert block');
    }

    // Return the result with blockId
    return result;
  },

  updateBlock: async (
    id: string,
    blockId?: string,
    type?: string,
    source?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> => {
    // Accept object from executor, destructure it
    const params =
      typeof id === 'object'
        ? (id as any)
        : { id, blockId, type, source, metadata };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    // Get the existing block first
    const existingBlock = await adapter.getBlockById(params.blockId);
    if (!existingBlock) {
      throw new Error(`Block ${params.blockId} not found`);
    }

    // Merge updates with existing block
    const updatedBlock: LexicalBlock = {
      ...existingBlock,
      block_type: params.type ?? existingBlock.block_type,
      source: params.source ?? existingBlock.source,
      metadata: {
        ...existingBlock.metadata,
        ...params.metadata,
      },
    };

    const result = await adapter.updateBlock(params.blockId, updatedBlock);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update block');
    }
  },

  deleteBlock: async (id: string, blockId?: string): Promise<void> => {
    // Single block deletion - delegates to deleteBlocks
    const params = typeof id === 'object' ? (id as any) : { id, blockId };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    const result = await adapter.deleteBlock([params.blockId]);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete block');
    }
  },

  deleteBlocks: async (
    id: string,
    blockIds?: string[],
  ): Promise<{ success: boolean; deletedBlocks?: Array<{ id: string }> }> => {
    // Multiple blocks deletion - handles array of IDs
    const params = typeof id === 'object' ? (id as any) : { id, blockIds };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    // Ensure blockIds is an array
    const idsArray = Array.isArray(params.blockIds)
      ? params.blockIds
      : [params.blockIds];

    const result = await adapter.deleteBlock(idsArray);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete block');
    }

    return result;
  },

  readBlock: async (
    id: string,
    blockId?: string,
  ): Promise<LexicalBlock | null> => {
    // Accept object from executor, destructure it
    const params = typeof id === 'object' ? (id as any) : { id, blockId };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    return await adapter.getBlockById(params.blockId);
  },

  readAllBlocks: async (
    id: string,
    format?: BlockFormat,
  ): Promise<LexicalBlock[] | BriefBlock[]> => {
    // Accept object from executor, destructure it
    const params =
      typeof id === 'object' ? (id as any) : { id, format: format || 'brief' };

    const adapter = get().lexicals.get(params.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${params.id} not found`);
    }

    return await adapter.getBlocks(params.format || 'brief');
  },

  runBlock: async (id: string, blockId?: string): Promise<any> => {
    const params = typeof id === 'object' ? id : { id, blockId };
    return (
      (await get()
        .lexicals.get(params.id as string)
        ?.adapter?.runBlock(params.blockId as string)) ?? {
        success: false,
        error: 'Adapter not found',
      }
    );
  },

  runAllBlocks: async (id: string): Promise<any> => {
    const params = typeof id === 'object' ? id : { id };
    return (
      (await get()
        .lexicals.get(params.id as string)
        ?.adapter?.runAllBlocks()) ?? {
        success: false,
        error: 'Adapter not found',
      }
    );
  },

  executeCode: async (
    id: string,
    code?: string,
    storeHistory?: boolean,
    silent?: boolean,
    stopOnError?: boolean,
  ): Promise<any> => {
    const params =
      typeof id === 'object'
        ? id
        : { id, code, storeHistory, silent, stopOnError };

    return (
      (await get()
        .lexicals.get(params.id as string)
        ?.adapter?.executeCode(
          params.code as string,
          params.storeHistory,
          params.silent,
          params.stopOnError,
        )) ?? { success: false, error: 'Adapter not found' }
    );
  },

  clearAllOutputs: async (id: string): Promise<OperationResult> => {
    const params = typeof id === 'object' ? id : { id };
    const adapter = get().lexicals.get(params.id as string)?.adapter;
    if (!adapter) {
      return { success: false, error: 'Adapter not found' };
    }
    return await adapter.clearAllOutputs();
  },

  restartKernel: async (id: string): Promise<OperationResult> => {
    const params = typeof id === 'object' ? id : { id };
    const adapter = get().lexicals.get(params.id as string)?.adapter;
    if (!adapter) {
      return { success: false, error: 'Adapter not found' };
    }
    return await adapter.restartKernel();
  },

  getBlockCount: async (id: string): Promise<number> => {
    const blocks = await get().readAllBlocks(id);
    return blocks.length;
  },

  listAvailableBlocks: async (
    id: string,
  ): Promise<{
    success: boolean;
    types?: any[];
    count?: number;
    error?: string;
  }> => {
    console.log('[LexicalState] 🔍 listAvailableBlocks CALLED with:', { id });

    // Delegate to adapter (following consistent pattern with all other operations)
    const params = typeof id === 'object' ? id : { id };
    console.log('[LexicalState] 📦 Processed params:', params);

    // Special case: this operation is static and doesn't require a document
    // If no document is found, call the operation directly
    const adapter = get().lexicals.get(params.id as string)?.adapter;

    if (!adapter) {
      // Call operation directly without adapter (static operation)
      const { listAvailableBlocksOperation } =
        await import('../tools/operations/listAvailableBlocks');
      const result = await listAvailableBlocksOperation.execute(
        { type: 'all' },
        { documentId: 'static', executor: null as any },
      );
      return result;
    }

    const result = await adapter.listAvailableBlocks();
    return result;
  },

  reset: () => set({ lexicals: new Map() }),
}));

/**
 * React hook for using Lexical store
 * Supports both full state and selector patterns
 * Renamed from useLexicalState to match Notebook2 pattern (useNotebookStore2)
 *
 * @example
 * // Get full state
 * const state = useLexicalStore();
 *
 * @example
 * // Use selector for performance
 * const adapter = useLexicalStore(state => state.selectLexicalAdapter('doc1'));
 */
export function useLexicalStore(): LexicalState;
export function useLexicalStore<T>(selector: (state: LexicalState) => T): T;
export function useLexicalStore<T>(
  selector?: (state: LexicalState) => T,
): LexicalState | T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useStore(lexicalStore, selector!);
}

export default useLexicalStore;
