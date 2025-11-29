/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Types for Lexical document tool operations.
 *
 * @module tools/core/types
 */

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
 * Block format for controlling response detail level
 */
export type BlockFormat = 'brief' | 'detailed';

/**
 * Brief block representation for structure queries
 * Includes block_id, block_type, and a 40-char content preview
 */
export interface BriefBlock {
  /** Unique block identifier */
  block_id: string;

  /** Block type identifier */
  block_type: string;

  /** 40-character preview of block content (empty for horizontalrule) */
  preview: string;
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
