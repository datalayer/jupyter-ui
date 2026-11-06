/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The executor an operation reaches its document through.
 *
 * Moved to `@datalayer/reactor/tools` (6 November 2026): every host — the
 * notebook, a Lexical document, a deck, a sheet, an arena — reads one
 * vocabulary there. Re-exported here so that `@datalayer/jupyter-react/tools`
 * keeps saying it.
 *
 * @module tools/core/executor
 */

export { DefaultExecutor } from '@datalayer/reactor/tools';
export type { ToolExecutor } from '@datalayer/reactor/tools';
