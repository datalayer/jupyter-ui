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
import { validateWithZod } from '@datalayer/jupyter-react/tools';
import {
  listAvailableBlocksParamsSchema,
  type ListAvailableBlocksParams,
} from '../schemas/listAvailableBlocks';

/**
 * Example block usage
 */
export interface BlockExample {
  /** Block type identifier (e.g., "paragraph", "code", "jupyter-cell") */
  type: string;

  /** Example source code or text content */
  source: string;

  /** Example metadata (aligned with Jupyter format) */
  metadata?: Record<string, unknown>;
}

/**
 * Schema for a single block type
 */
export interface BlockTypeSchema {
  /** Block type identifier - use this value when inserting blocks */
  type: string;

  /** Human-readable display name */
  displayName: string;

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
      metadata: { tag: 'h1' },
    },
  },

  // Quote blocks
  {
    type: 'quote',
    displayName: 'Blockquote',
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
      metadata: { listType: 'number', start: 1 },
    },
  },

  // Horizontal rule blocks
  {
    type: 'horizontalrule',
    displayName: 'Horizontal Rule',
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
      metadata: { language: 'python' },
    },
  },

  // Code blocks (static, non-executable)
  {
    type: 'code',
    displayName: 'Code Block',
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
      metadata: { language: 'sql' },
    },
  },

  // Equation blocks
  {
    type: 'equation',
    displayName: 'Equation',
    description:
      'A LaTeX equation block for mathematical notation. IMPORTANT: Use type: "equation" NOT type: "media". The category is "media" but you must use the block type "equation" when inserting. Use LaTeX syntax in the source field. Equations are always displayed as centered display equations (not inline). Do NOT include metadata.inline - it is always false.',
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
      metadata: {},
    },
  },

  // YouTube video blocks
  {
    type: 'youtube',
    displayName: 'YouTube Video',
    description:
      'Embed a YouTube video. The source field is OPTIONAL - if empty or omitted, a default example video is automatically used. To embed a specific video, put the 11-character video ID in source (extract from URLs like youtube.com/watch?v=VIDEO_ID). Examples: Default: { type: "youtube", source: "", metadata: {} }. Custom: { type: "youtube", source: "dQw4w9WgXcQ", metadata: {} }.',
    requiredProperties: [],
    optionalProperties: {},
    canContainChildren: false,
    isExecutable: false,
    example: {
      type: 'youtube',
      source: '',
      metadata: {},
    },
  },

  // Excalidraw drawing blocks
  // DISABLED: Excalidraw blocks are read-only. They can be viewed with readAllBlocks but not inserted via agent tools.
  // {
  //   type: 'excalidraw',
  //   displayName: 'Excalidraw Drawing',
  //   description:
  //     'Interactive drawing canvas for diagrams and sketches using Excalidraw. IMPORTANT: Use type: "excalidraw" NOT type: "media". The category is "media" but you must use the block type "excalidraw" when inserting.',
  //   optionalProperties: {
  //     data: {
  //       type: 'string',
  //       description: 'Excalidraw JSON data (default: "[]" for empty canvas)',
  //       default: '[]',
  //     },
  //     width: {
  //       type: 'number',
  //       description: 'Canvas width in pixels',
  //     },
  //     height: {
  //       type: 'number',
  //       description: 'Canvas height in pixels',
  //     },
  //   },
  //   canContainChildren: false,
  //   isExecutable: false,
  //   example: {
  //     type: 'excalidraw',
  //     source: '',
  //     metadata: { data: '[]' },
  //   },
  // },

  // Table blocks
  {
    type: 'table',
    displayName: 'Table',
    description:
      'Data table with rows and columns. Use type: "table" when inserting. THREE ways to populate: (1) RECOMMENDED - metadata.data as 2D array: {type: "table", source: "", metadata: {data: [["A", "B"], ["C", "D"]]}} creates a 2x2 table with data. (2) source as markdown table: {type: "table", source: "A | B\\n---|---\\nC | D", metadata: {}} is automatically parsed. (3) Empty table with dimensions: {type: "table", source: "", metadata: {rows: 3, columns: 4}} creates empty 3x4 table. When using data or markdown, rows/columns are auto-detected and should NOT be specified.',
    optionalProperties: {
      data: {
        type: 'array',
        description:
          'RECOMMENDED: Table cell contents as 2D array of strings. Example: [["Name", "Age"], ["Alice", "30"], ["Bob", "25"]] creates a 3x2 table. First row becomes headers if includeHeaders is true (default). Rows and columns auto-detected.',
      },
      rows: {
        type: 'number',
        description:
          'Number of rows for EMPTY table (default: 2). Ignored if data or markdown source provided.',
        default: 2,
      },
      columns: {
        type: 'number',
        description:
          'Number of columns for EMPTY table (default: 2). Ignored if data or markdown source provided.',
        default: 2,
      },
      includeHeaders: {
        type: 'boolean',
        description:
          'First row becomes headers (default: true). Applies to all creation methods.',
        default: true,
      },
    },
    canContainChildren: true,
    isExecutable: false,
    example: {
      type: 'table',
      source: '',
      metadata: {
        data: [
          ['Name', 'Age'],
          ['Alice', '30'],
          ['Bob', '25'],
        ],
      },
    },
  },

  // Collapsible section blocks
  {
    type: 'collapsible',
    displayName: 'Collapsible Section',
    description:
      'Expandable/collapsible section with title header. IMPORTANT: Use type: "collapsible" NOT type: "structure". The title text goes in the source field. EXAMPLE: {type: "collapsible", source: "My Title", metadata: {open: true}}. To add content INSIDE collapsible: (1) Insert collapsible first, get block_id from response. (2) Insert child blocks with metadata.collapsible = collapsible_block_id. EXAMPLE: insertBlock({afterId: "6", type: "paragraph", source: "text", metadata: {collapsible: "6"}}) puts paragraph INSIDE collapsible "6".',
    optionalProperties: {
      open: {
        type: 'boolean',
        description: 'Whether the section is expanded (default: true)',
        default: true,
      },
      collapsible: {
        type: 'string',
        description:
          'ONLY for insertBlock when adding content INSIDE a collapsible. Set to block_id of the collapsible container.',
      },
    },
    canContainChildren: true,
    isExecutable: false,
    example: {
      type: 'collapsible',
      source: 'Section Title',
      metadata: { open: true },
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
    _context: ToolExecutionContext,
  ): Promise<ListAvailableBlocksResult> {
    console.log('[listAvailableBlocks] 🔍 execute CALLED');
    console.log('[listAvailableBlocks] Params:', params);
    console.log('[listAvailableBlocks] Context:', _context);

    // Validate params using Zod
    console.log('[listAvailableBlocks] 📝 Validating params...');
    const validatedParams = validateWithZod(
      listAvailableBlocksParamsSchema as any,
      params || {},
      'listAvailableBlocks',
    ) as ListAvailableBlocksParams;
    console.log('[listAvailableBlocks] ✅ Validated params:', validatedParams);

    try {
      // Use static block type definitions
      // This operation returns schema metadata, not runtime state
      console.log('[listAvailableBlocks] 📚 Using DEFAULT_BLOCK_TYPES');
      let types = DEFAULT_BLOCK_TYPES;

      // Filter by type if specified
      const requestedType = validatedParams.type || 'all';
      console.log('[listAvailableBlocks] 🔍 Requested type:', requestedType);

      if (requestedType !== 'all') {
        types = types.filter(t => t.type === requestedType);
        console.log(
          '[listAvailableBlocks] 🔎 Filtered to',
          types.length,
          'type(s)',
        );
      }

      console.log(
        '[listAvailableBlocks] ✅ Returning result with',
        types.length,
        'types',
      );
      return {
        success: true,
        types,
        count: types.length,
      };
    } catch (error) {
      console.error('[listAvailableBlocks] ❌ ERROR:', error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to list available blocks: ${errorMessage}`);
    }
  },
};
