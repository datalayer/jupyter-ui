/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
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
import { LexicalAdapter } from './LexicalAdapter';
import type { LexicalBlock } from '../tools/core/types';

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
  properties?: Record<string, unknown>;
  afterId: string;
};

export type InsertBlocksMutation = {
  id: string;
  blocks: Array<{
    type: string;
    source: string;
    properties?: Record<string, unknown>;
  }>;
  afterId: string;
};

export type UpdateBlockMutation = {
  id: string;
  blockId: string;
  type?: string;
  source?: string;
  properties?: Record<string, unknown>;
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

  // Tool-aligned operations
  insertBlock: (mutation: InsertBlockMutation) => Promise<void>;
  insertBlocks: (mutation: InsertBlocksMutation) => Promise<void>;
  updateBlock: (mutation: UpdateBlockMutation) => Promise<void>;
  deleteBlock: (mutation: DeleteBlockMutation) => Promise<void>;
  readBlock: (mutation: ReadBlockMutation) => Promise<LexicalBlock | null>;
  readAllBlocks: (id: string) => Promise<LexicalBlock[]>;
  runBlock: (id: string, blockId: string) => Promise<void>;
  runAllBlocks: (id: string) => Promise<void>;

  // Additional utility methods
  getBlockCount: (id: string) => Promise<number>;
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
  insertBlock: async (mutation: InsertBlockMutation): Promise<void> => {
    const adapter = get().lexicals.get(mutation.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${mutation.id} not found`);
    }

    const block: LexicalBlock = {
      block_id: '', // Will be assigned by editor
      block_type: mutation.type,
      source: mutation.source,
      metadata: mutation.properties,
    };

    const result = await adapter.insertBlock(block, mutation.afterId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to insert block');
    }
  },

  insertBlocks: async (mutation: InsertBlocksMutation): Promise<void> => {
    const adapter = get().lexicals.get(mutation.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${mutation.id} not found`);
    }

    const blocks: LexicalBlock[] = mutation.blocks.map(b => ({
      block_id: '',
      block_type: b.type,
      source: b.source,
      metadata: b.properties,
    }));

    const result = await adapter.insertBlocks(blocks, mutation.afterId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to insert blocks');
    }
  },

  updateBlock: async (mutation: UpdateBlockMutation): Promise<void> => {
    const adapter = get().lexicals.get(mutation.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${mutation.id} not found`);
    }

    // Get the existing block first
    const existingBlock = await adapter.getBlockById(mutation.blockId);
    if (!existingBlock) {
      throw new Error(`Block ${mutation.blockId} not found`);
    }

    // Merge updates with existing block
    const updatedBlock: LexicalBlock = {
      ...existingBlock,
      block_type: mutation.type ?? existingBlock.block_type,
      source: mutation.source ?? existingBlock.source,
      metadata: {
        ...existingBlock.metadata,
        ...mutation.properties,
      },
    };

    const result = await adapter.updateBlock(mutation.blockId, updatedBlock);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update block');
    }
  },

  deleteBlock: async (mutation: DeleteBlockMutation): Promise<void> => {
    const adapter = get().lexicals.get(mutation.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${mutation.id} not found`);
    }

    const result = await adapter.deleteBlock(mutation.blockId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete block');
    }
  },

  readBlock: async (
    mutation: ReadBlockMutation,
  ): Promise<LexicalBlock | null> => {
    const adapter = get().lexicals.get(mutation.id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${mutation.id} not found`);
    }

    return await adapter.getBlockById(mutation.blockId);
  },

  readAllBlocks: async (id: string): Promise<LexicalBlock[]> => {
    const adapter = get().lexicals.get(id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${id} not found`);
    }

    return await adapter.getBlocks();
  },

  runBlock: async (id: string, blockId: string): Promise<void> => {
    const adapter = get().lexicals.get(id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${id} not found`);
    }

    const result = await adapter.runBlock(blockId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to run block');
    }
  },

  runAllBlocks: async (id: string): Promise<void> => {
    const adapter = get().lexicals.get(id)?.adapter;
    if (!adapter) {
      throw new Error(`Lexical document ${id} not found`);
    }

    const result = await adapter.runAllBlocks();
    if (!result.success) {
      throw new Error(result.error || 'Failed to run all blocks');
    }
  },

  getBlockCount: async (id: string): Promise<number> => {
    const blocks = await get().readAllBlocks(id);
    return blocks.length;
  },

  reset: () => set({ lexicals: new Map() }),
}));

/**
 * React hook for using Lexical state
 * Supports both full state and selector patterns
 *
 * @example
 * // Get full state
 * const state = useLexicalState();
 *
 * @example
 * // Use selector for performance
 * const adapter = useLexicalState(state => state.selectLexicalAdapter('doc1'));
 */
export function useLexicalState(): LexicalState;
export function useLexicalState<T>(selector: (state: LexicalState) => T): T;
export function useLexicalState<T>(
  selector?: (state: LexicalState) => T,
): LexicalState | T {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return useStore(lexicalStore, selector!);
}
