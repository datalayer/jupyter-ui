/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Chunk exports - for explicit loading of individual component chunks
 */

// Each chunk is designed to be independently loadable
// Use dynamic imports for lazy loading:
//
// const CellChunk = lazy(() => import('./CellChunk'));

export { CellChunk } from './CellChunk';
export { NotebookChunk } from './NotebookChunk';
export { OutputChunk } from './OutputChunk';
export { TerminalChunk } from './TerminalChunk';
export { ConsoleChunk } from './ConsoleChunk';
export { ViewerChunk } from './ViewerChunk';
