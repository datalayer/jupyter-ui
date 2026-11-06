/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tool configuration and definition schemas.
 *
 * Moved to `@datalayer/reactor/tools` (6 November 2026): every host — the
 * notebook, a Lexical document, a deck, a sheet, an arena — reads one
 * vocabulary there. Re-exported here so that `@datalayer/jupyter-react/tools`
 * keeps saying it.
 *
 * @module tools/core/schema
 */

export type {
  ToolConfig,
  ToolDefinition,
  ToolParameters,
} from '@datalayer/reactor/tools';
