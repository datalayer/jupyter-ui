/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * List available block types operation for Lexical documents
 *
 * This operation returns the schema of all registered Lexical node types,
 * helping Copilot understand what blocks can be inserted and their properties.
 *
 * @module tools/core/operations/listAvailableBlocks
 */

import type {
  ToolOperation,
  LexicalExecutionContext,
} from '../core/interfaces';
import type { RegisteredNodeInfo } from '../core/types';
import { formatResponse } from '../core/formatter';

/**
 * Block category types
 */
export type BlockCategory =
  | 'text'
  | 'heading'
  | 'code'
  | 'media'
  | 'list'
  | 'table'
  | 'special';

/**
 * Parameters for listing available blocks
 */
export interface ListAvailableBlocksParams {
  /**
   * Optional category filter
   */
  category?: BlockCategory;
}

/**
 * Example block usage
 */
export interface BlockExample {
  /** Block type identifier (e.g., "paragraph", "code", "jupyter-cell") */
  type: string;

  /** Example source code or text content */
  source: string;

  /** Example properties/metadata */
  properties?: Record<string, unknown>;
}

/**
 * Schema for a single block type
 */
export interface BlockTypeSchema {
  /** Block type identifier */
  type: string;

  /** Human-readable display name */
  displayName: string;

  /** Block category */
  category: BlockCategory;

  /** Description of what this block does */
  description: string;

  /** Required properties for this block type */
  requiredProperties?: string[];

  /** Optional properties with their schemas */
  optionalProperties?: Record<
    string,
    {
      type: string;
      description: string;
      enum?: string[];
      default?: unknown;
    }
  >;

  /** Example usage */
  example?: BlockExample;

  /** Whether this block can contain children */
  canContainChildren?: boolean;

  /** Whether this block is executable (like Jupyter code blocks) */
  isExecutable?: boolean;
}

/**
 * Result of listing available blocks
 */
export interface ListAvailableBlocksResult {
  /** Whether the operation succeeded */
  success: boolean;

  /** Array of available block type schemas */
  types?: BlockTypeSchema[];

  /** Number of available block types */
  count?: number;

  /** Categories available */
  categories?: BlockCategory[];

  /** Error message if operation failed */
  error?: string;
}

/**
 * Validates ListAvailableBlocksParams at runtime.
 */
function isListAvailableBlocksParams(
  params: unknown,
): params is ListAvailableBlocksParams {
  if (typeof params !== 'object' || params === null) {
    return false;
  }

  const p = params as Record<string, unknown>;

  // category is optional, but if provided must be a valid BlockCategory
  if (p.category !== undefined) {
    const validCategories: BlockCategory[] = [
      'text',
      'heading',
      'code',
      'media',
      'list',
      'table',
      'special',
    ];
    if (
      typeof p.category !== 'string' ||
      !validCategories.includes(p.category as BlockCategory)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Default Lexical block types supported by the editor
 *
 * This represents the standard Lexical node types plus custom Datalayer extensions.
 */
const DEFAULT_BLOCK_TYPES: BlockTypeSchema[] = [
  // Text blocks
  {
    type: 'paragraph',
    displayName: 'Paragraph',
    category: 'text',
    description: 'A regular paragraph block for text content',
    canContainChildren: true,
    example: {
      type: 'paragraph',
      source: 'This is a regular paragraph with text.',
    },
  },

  // Heading blocks
  {
    type: 'heading',
    displayName: 'Heading',
    category: 'heading',
    description: 'A heading block with configurable level (h1-h6)',
    requiredProperties: ['tag'],
    optionalProperties: {
      tag: {
        type: 'string',
        description: 'Heading level from h1 to h6',
        enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
        default: 'h2',
      },
    },
    canContainChildren: true,
    example: {
      type: 'heading',
      source: 'Introduction',
      properties: { tag: 'h1' },
    },
  },

  // Code blocks
  {
    type: 'code',
    displayName: 'Code Block',
    category: 'code',
    description: 'A code block with syntax highlighting and optional execution',
    optionalProperties: {
      language: {
        type: 'string',
        description: 'Programming language for syntax highlighting',
        enum: [
          'python',
          'javascript',
          'typescript',
          'bash',
          'sql',
          'json',
          'yaml',
          'markdown',
        ],
        default: 'python',
      },
      executable: {
        type: 'boolean',
        description: 'Whether the code can be executed',
        default: false,
      },
    },
    canContainChildren: false,
    isExecutable: true,
    example: {
      type: 'code',
      source: "import numpy as np\nprint('Hello, World!')",
      properties: { language: 'python', executable: true },
    },
  },

  // Quote blocks
  {
    type: 'quote',
    displayName: 'Blockquote',
    category: 'text',
    description: 'A blockquote for highlighting quoted text',
    canContainChildren: true,
    example: {
      type: 'quote',
      source: 'To be or not to be, that is the question.',
    },
  },

  // List blocks
  {
    type: 'list',
    displayName: 'List',
    category: 'list',
    description:
      'A list container supporting bullet, numbered, or checkbox lists',
    requiredProperties: ['listType'],
    optionalProperties: {
      listType: {
        type: 'string',
        description: 'Type of list: bullet, numbered, or checkbox',
        enum: ['bullet', 'number', 'check'],
        default: 'bullet',
      },
      start: {
        type: 'number',
        description: 'Starting number for numbered lists',
        default: 1,
      },
    },
    canContainChildren: true,
    example: {
      type: 'list',
      source: '',
      properties: { listType: 'bullet' },
    },
  },

  {
    type: 'listitem',
    displayName: 'List Item',
    category: 'list',
    description: 'An individual item within a list',
    optionalProperties: {
      checked: {
        type: 'boolean',
        description: 'Whether the checkbox is checked (for checklist items)',
        default: false,
      },
    },
    canContainChildren: true,
    example: {
      type: 'listitem',
      source: 'First item in the list',
    },
  },

  // Table blocks
  {
    type: 'table',
    displayName: 'Table',
    category: 'table',
    description: 'A table for displaying structured tabular data',
    canContainChildren: true,
    example: {
      type: 'table',
      source: '',
    },
  },

  // Special Datalayer blocks
  {
    type: 'jupyter-cell',
    displayName: 'Jupyter Code Cell',
    category: 'special',
    description: 'An executable Jupyter code cell integrated into the document',
    optionalProperties: {
      language: {
        type: 'string',
        description: 'Programming language for the cell',
        enum: ['python', 'javascript'],
        default: 'python',
      },
      kernelName: {
        type: 'string',
        description: 'Name of the Jupyter kernel to use',
      },
    },
    canContainChildren: false,
    isExecutable: true,
    example: {
      type: 'jupyter-cell',
      source:
        "import pandas as pd\ndf = pd.DataFrame({'A': [1, 2, 3]})\ndf.head()",
      properties: { language: 'python' },
    },
  },
];

/**
 * List available blocks operation
 *
 * Returns the schema of all registered Lexical node types, enabling
 * Copilot to understand what blocks can be inserted and how to use them.
 *
 * **How it works:**
 * 1. LexicalHandle.getAvailableBlockTypes() queries the editor's registered nodes
 *    - Accesses editor._nodes Map (contains all node classes)
 *    - Returns array with node.getType() for each registered node
 * 2. We match node types with DEFAULT_BLOCK_TYPES schemas
 * 3. Only return schemas for nodes that are actually registered
 *
 * **What Lexical nodes actually expose:**
 * - getType(): string (e.g., "equation", "image", "jupyter-cell")
 * - Constructor name (e.g., EquationNode, ImageNode, JupyterCellNode)
 * - That's it! Nodes don't expose descriptions or metadata
 *
 * **Our schema provides:**
 * - displayName, description, category (from DEFAULT_BLOCK_TYPES)
 * - requiredProperties, optionalProperties (for construction)
 * - examples, canContainChildren, isExecutable (usage hints)
 */
export const listAvailableBlocksOperation: ToolOperation<
  ListAvailableBlocksParams,
  ListAvailableBlocksResult
> = {
  name: 'listAvailableBlocks',

  async execute(
    params: unknown,
    context: LexicalExecutionContext,
  ): Promise<ListAvailableBlocksResult> {
    // Validate params using type guard
    if (!isListAvailableBlocksParams(params)) {
      throw new Error(
        `Invalid parameters for listAvailableBlocks. Expected { category?: BlockCategory }. ` +
          `Received: ${JSON.stringify(params)}`,
      );
    }

    // Now TypeScript knows params is ListAvailableBlocksParams!
    const { category } = params;
    const { lexicalId } = context;

    try {
      let types = DEFAULT_BLOCK_TYPES;

      // Try to get dynamically registered types from the document
      // This is optional - if no lexicalId, we fall back to DEFAULT_BLOCK_TYPES
      if (lexicalId) {
        try {
          // Ensure executeCommand is available
          if (!context.executeCommand) {
            throw new Error(
              'executeCommand callback is required for this operation.',
            );
          }

          // Call internal command to get registered nodes
          const registeredNodes = await context.executeCommand<
            RegisteredNodeInfo[]
          >('lexical.getRegisteredNodes', {
            lexicalId,
          });

          if (registeredNodes && registeredNodes.length > 0) {
            // Lexical nodes have types like: "paragraph", "heading", "code", "quote",
            // "list", "listitem", "table", "equation", "image", "youtube", "jupyter-cell"
            const registeredTypes = new Set(
              registeredNodes.map(node => node.type.toLowerCase()),
            );

            // Filter to only schemas for registered node types
            types = DEFAULT_BLOCK_TYPES.filter(schema =>
              registeredTypes.has(schema.type.toLowerCase()),
            );
          }
        } catch (error) {
          console.warn(
            'Failed to get dynamic block types, using static list:',
            error,
          );
        }
      }

      // Filter by category if specified
      if (category) {
        types = types.filter(block => block.category === category);
      }

      // Extract unique categories
      const categories = Array.from(
        new Set(types.map(block => block.category)),
      );

      return formatResponse(
        {
          success: true,
          types,
          count: types.length,
          categories,
        },
        context.format,
      ) as ListAvailableBlocksResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list available blocks: ${errorMessage}`);
    }
  },
};
