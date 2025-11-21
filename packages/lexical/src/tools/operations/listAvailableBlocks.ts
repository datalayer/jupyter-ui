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

import type { ToolOperation, ToolExecutionContext } from '../core/interfaces';
import type { RegisteredNodeInfo } from '../core/types';
import { validateWithZod } from '@datalayer/jupyter-react/lib/tools/core/zodUtils';
import {
  listAvailableBlocksParamsSchema,
  type ListAvailableBlocksParams,
  type BlockCategory,
} from '../schemas/listAvailableBlocks';

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
    description:
      'A regular paragraph block for text content. Use plain text in source field - do NOT include markdown syntax.',
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
    description:
      'A semantic HTML heading block (NOT markdown). Use plain text in source field - do NOT include markdown syntax like # or ##. Specify heading level (h1-h6) via the tag property.',
    requiredProperties: ['tag'],
    optionalProperties: {
      tag: {
        type: 'string',
        description:
          'Heading level: h1 (largest) to h6 (smallest). Use h1 for main titles, h2 for sections, h3 for subsections.',
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
      'A list container supporting bullet or numbered items. Provide items as newline-separated text in the source field - each line becomes a separate list item automatically.',
    optionalProperties: {
      listType: {
        type: 'string',
        description: 'Type of list: bullet or number',
        enum: ['bullet', 'number'],
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
      source: 'Apple\nBanana\nTangerine',
      properties: { listType: 'number', start: 1 },
    },
  },

  // Horizontal rule blocks
  {
    type: 'horizontalrule',
    displayName: 'Horizontal Rule',
    category: 'text',
    description:
      'A horizontal divider line for visually separating sections of content. Source field should be empty or omitted.',
    canContainChildren: false,
    example: {
      type: 'horizontalrule',
      source: '',
    },
  },

  // Special Datalayer blocks - Jupyter cells
  {
    type: 'jupyter-cell',
    displayName: 'Jupyter Code Cell',
    category: 'jupyter',
    description:
      'An executable Jupyter code cell integrated into the document. RECOMMENDED: Use this for executable code (Python, JavaScript, etc.) instead of static code blocks, as it allows users to run code and see outputs directly in the document.',
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

  // Code blocks (static, non-executable)
  {
    type: 'code',
    displayName: 'Code Block',
    category: 'code',
    description:
      'A static code block for displaying code without execution. Use this ONLY for non-executable code like SQL queries, configuration files, or pseudocode. For executable Python/JavaScript code, prefer jupyter-cell instead.',
    optionalProperties: {
      language: {
        type: 'string',
        description:
          'Programming language for syntax highlighting (e.g., sql, json, yaml, bash)',
        default: 'plaintext',
      },
    },
    canContainChildren: false,
    isExecutable: false,
    example: {
      type: 'code',
      source: 'SELECT * FROM users WHERE active = true;',
      properties: { language: 'sql' },
    },
  },

  // Equation blocks
  {
    type: 'equation',
    displayName: 'Equation',
    category: 'media',
    description:
      'A LaTeX equation block for mathematical notation. Use LaTeX syntax in the source field. Equations are always displayed as centered display equations (not inline). Do NOT include properties.inline - it is always false.',
    optionalProperties: {
      equation: {
        type: 'string',
        description:
          'LaTeX equation string (e.g., "E = mc^2" or "\\\\frac{a}{b}" or "\\\\int_0^\\\\infty e^{-x} dx"). Note: this is optional - you can also just put the LaTeX in the source field.',
      },
    },
    canContainChildren: false,
    isExecutable: false,
    example: {
      type: 'equation',
      source: 'E = mc^2',
      properties: {},
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
    context: ToolExecutionContext,
  ): Promise<ListAvailableBlocksResult> {
    // Validate params using Zod
    const validatedParams = validateWithZod(
      listAvailableBlocksParamsSchema as any,
      params || {},
      'listAvailableBlocks',
    ) as ListAvailableBlocksParams;

    const { category } = validatedParams;
    const { documentId } = context;

    try {
      let types = DEFAULT_BLOCK_TYPES;

      // Try to get dynamically registered types from the document
      // This is optional - if no documentId or executor, we fall back to DEFAULT_BLOCK_TYPES
      if (documentId && context.executor) {
        try {
          // Call executor to get registered nodes
          const registeredNodes = (await context.executor.execute(
            'listAvailableBlocks',
            {},
          )) as RegisteredNodeInfo[];

          if (registeredNodes && registeredNodes.length > 0) {
            // Lexical nodes have types like: "paragraph", "heading", "code", "quote",
            // "list", "listitem", "table", "equation", "image", "youtube", "jupyter-cell"
            const registeredTypes = new Set(
              registeredNodes.map((node: RegisteredNodeInfo) =>
                node.type.toLowerCase(),
              ),
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

      return {
        success: true,
        types,
        count: types.length,
        categories,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list available blocks: ${errorMessage}`);
    }
  },
};
