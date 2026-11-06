/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Zod utility functions for tool parameter validation.
 *
 * Moved to `@datalayer/reactor/tools` (6 November 2026): every host — the
 * notebook, a Lexical document, a deck, a sheet, an arena — reads one
 * vocabulary there. Re-exported here so that `@datalayer/jupyter-react/tools`
 * keeps saying it.
 *
 * @module tools/core/zodUtils
 */

export { zodToToolParameters, validateWithZod } from '@datalayer/reactor/tools';
