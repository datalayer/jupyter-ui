/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Types for notebook tool operations.
 *
 * @module tools/core/types
 */

/**
 * Cell format for controlling response detail level
 */
export type CellFormat = 'brief' | 'detailed';

/**
 * Brief cell representation for structure queries
 * Includes index, type, and a 40-char content preview
 */
export interface BriefCell {
  /** Cell index in notebook */
  index: number;

  /** Cell type (code, markdown, raw) */
  type: string;

  /** 40-character preview of cell source */
  preview: string;
}

/**
 * Detailed cell representation with full content
 */
export interface DetailedCell {
  /** Cell index in notebook */
  index: number;

  /** Cell type (code, markdown, raw) */
  type: string;

  /** Full cell source code */
  source: string;

  /** Execution count for code cells */
  execution_count?: number | null;

  /** Cell outputs (for code cells) */
  outputs?: string[];
}
