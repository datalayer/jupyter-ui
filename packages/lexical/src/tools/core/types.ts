/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Shared types for platform-agnostic tool operations.
 * These types represent the core data structures used across all platforms.
 *
 * @module tools/core/types
 */

/**
 * Cell type enumeration
 */
export type CellType = 'code' | 'markdown' | 'raw';

/**
 * Cell output data structure
 */
export interface CellOutput {
  output_type: 'stream' | 'display_data' | 'execute_result' | 'error';
  // Stream output
  name?: 'stdout' | 'stderr';
  text?: string | string[];
  // Display data / execute result
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  execution_count?: number;
  // Error output
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

/**
 * Cell data structure (platform-agnostic representation)
 */
export interface CellData {
  /** Cell type */
  type: CellType;

  /** Cell source code or markdown content */
  source: string | string[];

  /** Cell outputs (for code cells) */
  outputs?: CellOutput[];

  /** Cell metadata */
  metadata?: Record<string, unknown>;

  /** Execution count (for code cells) */
  execution_count?: number | null;
}

/**
 * Notebook metadata
 */
export interface NotebookMetadata {
  /** Notebook path or URI */
  path?: string;

  /** Total number of cells */
  cellCount: number;

  /** Breakdown by cell type */
  cellTypes: {
    code: number;
    markdown: number;
    raw: number;
  };

  /** Kernel information */
  kernelspec?: {
    name: string;
    display_name: string;
    language?: string;
  };

  /** Language info */
  language_info?: {
    name: string;
    version?: string;
    mimetype?: string;
    file_extension?: string;
  };

  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cell execution result
 */
export interface ExecutionResult {
  /** Whether execution succeeded */
  success: boolean;

  /** Execution order number */
  executionOrder?: number;

  /** Output data */
  outputs: CellOutput[];

  /** Error message if execution failed */
  error?: string;

  /** Execution duration in milliseconds */
  duration?: number;
}

/**
 * Runtime information (for runtime management operations)
 */
export interface RuntimeInfo {
  /** Runtime unique identifier */
  id: string;

  /** Runtime name (pod name) */
  name: string;

  /** Environment name */
  environment?: string;

  /** Runtime status */
  status: 'creating' | 'running' | 'terminating' | 'terminated' | 'error';

  /** Creation timestamp */
  createdAt?: Date;

  /** Duration in minutes */
  durationMinutes?: number;

  /** Additional runtime metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Notebook creation parameters
 */
export interface NotebookCreationParams {
  /** Notebook name */
  name: string;

  /** Optional description */
  description?: string;

  /** Space identifier (for remote notebooks) */
  spaceId?: string;

  /** Space name (for remote notebooks) */
  spaceName?: string;

  /** Initial cells (optional) */
  initialCells?: CellData[];
}

/**
 * Notebook creation result
 */
export interface NotebookCreationResult {
  /** Success status */
  success: boolean;

  /** Notebook unique identifier */
  notebookId?: string;

  /** Notebook URI or path */
  uri: string;

  /** Error message if creation failed */
  error?: string;
}

/**
 * Lexical document creation parameters
 */
export interface LexicalCreationParams {
  /** Document name */
  name: string;

  /** Optional description */
  description?: string;

  /** Space identifier (for remote documents) */
  spaceId?: string;

  /** Space name (for remote documents) */
  spaceName?: string;
}

/**
 * Lexical document creation result
 */
export interface LexicalCreationResult {
  /** Success status */
  success: boolean;

  /** Document unique identifier */
  documentId?: string;

  /** Document URI or path */
  uri: string;

  /** Error message if creation failed */
  error?: string;
}

/**
 * Runtime creation parameters
 */
export interface RuntimeCreationParams {
  /** Optional environment name */
  environment?: string;

  /** Optional duration in minutes */
  durationMinutes?: number;
}

/**
 * Runtime creation result
 */
export interface RuntimeCreationResult {
  /** Success status */
  success: boolean;

  /** Runtime information */
  runtime?: RuntimeInfo;

  /** Error message if creation failed */
  error?: string;
}

/**
 * Runtime connection parameters
 */
export interface RuntimeConnectionParams {
  /** Optional runtime name to connect */
  runtimeName?: string;

  /** Optional notebook URI */
  notebookUri?: string;
}

/**
 * Runtime connection result
 */
export interface RuntimeConnectionResult {
  /** Success status */
  success: boolean;

  /** Connected runtime information */
  runtime?: RuntimeInfo;

  /** Error message if connection failed */
  error?: string;
}

// ============================================================================
// Lexical Block Types
// ============================================================================

/**
 * Lexical text node within a block
 * Simplified for LLM consumption - preserves semantic formatting only
 */
export interface LexicalTextNode {
  /** Text content */
  text: string;

  /** Semantic formatting (bold=1, italic=2, strikethrough=4, underline=8, code=16) */
  format?: number;

  /** Text style (CSS) - only preserved for critical styling */
  style?: string;
}

/**
 * Lexical block data structure
 *
 * ALIGNED WITH JUPYTER NOTEBOOK FORMAT for better Copilot understanding:
 * - block_type ↔ cell_type (e.g., "markdown", "code", "heading")
 * - source ↔ source (text content as string or string[])
 * - metadata ↔ metadata (block-specific properties)
 * - block_id ↔ UNIQUE (stable identifier for addressing blocks)
 *
 * Common block types:
 * - "paragraph" - Regular text paragraph
 * - "heading" - Heading (metadata.level: 1-6)
 * - "code" - Code block (metadata.language: "python", "javascript", etc.)
 * - "quote" - Blockquote
 * - "list" - List container (metadata.list_type: "bullet"|"number"|"check")
 * - "listitem" - List item (metadata.checked for checklists)
 * - "jupyter-cell" - Executable Jupyter cell (metadata.language, outputs)
 * - "equation" - Math equation (metadata.latex, metadata.inline)
 * - "image" - Image (metadata.src, metadata.alt_text)
 */
export interface LexicalBlock {
  /** Unique block identifier (Lexical node key) - use this for stable addressing */
  block_id: string;

  /** Block type identifier (analogous to Jupyter's cell_type) */
  block_type: string;

  /** Block content (analogous to Jupyter's source) */
  source: string | string[];

  /** Block metadata (analogous to Jupyter's metadata) */
  metadata?: {
    /** Heading level (1-6) */
    level?: number;

    /** Code/cell language */
    language?: string;

    /** List type */
    list_type?: 'bullet' | 'number' | 'check';

    /** Checklist item state */
    checked?: boolean;

    /** Jupyter cell outputs */
    outputs?: Array<{
      output_type: string;
      text?: string;
      data?: Record<string, unknown>;
    }>;

    /** Equation LaTeX */
    latex?: string;

    /** Inline equation flag */
    inline?: boolean;

    /** Image source */
    src?: string;

    /** Image alt text */
    alt_text?: string;

    /** Additional type-specific properties */
    [key: string]: unknown;
  };

  /** Inline formatting (for preserving rich text within source) */
  formatting?: Array<{
    /** Text segment */
    text: string;
    /** Format flags (bold=1, italic=2, strikethrough=4, underline=8, code=16) */
    format?: number;
  }>;
}

/**
 * Complete Lexical document structure
 */
export interface LexicalDocumentData {
  /** Root block containing all content */
  root: {
    /** Array of top-level blocks */
    children: LexicalBlock[];

    /** Root direction */
    direction: 'ltr' | 'rtl' | null;

    /** Root format */
    format: string;

    /** Root indent */
    indent: number;

    /** Root type - always "root" */
    type: 'root';

    /** Root version */
    version: number;
  };

  /** Last saved timestamp */
  lastSaved?: number;

  /** Document source */
  source?: string;

  /** Document version */
  version?: string;
}

/**
 * Lexical document metadata
 */
export interface LexicalMetadata {
  /** Document path/URI */
  path: string;

  /** Total block count */
  blockCount: number;

  /** Block type counts */
  blockTypes: Record<string, number>;
}

/**
 * Runtime information about a registered Lexical node
 * Based on actual Lexical node class structure:
 * - getType(): Returns the node type string (e.g., "equation", "image", "jupyter-cell")
 * - Node classes extend DecoratorNode, ElementNode, or TextNode
 * - exportJSON() defines serialized structure but doesn't expose metadata
 */
export interface RegisteredNodeInfo {
  /** Node type identifier from node.getType() (e.g., "heading", "paragraph", "equation") */
  type: string;
  /** Node class name (constructor name) */
  className?: string;
}
