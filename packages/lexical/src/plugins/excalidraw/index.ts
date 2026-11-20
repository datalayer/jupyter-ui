/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Drawing in a Lexical document.
 *
 * The plugin, the node it inserts, and the Excalidraw tools of
 * `@datalayer/reactor-excalidraw` over the document's drawings. Mounting
 * `ExcalidrawPlugin` inside a `LexicalConfigProvider` is all that is needed
 * for the tools to appear.
 *
 * @module plugins/excalidraw
 */

export {
  ExcalidrawPlugin,
  INSERT_EXCALIDRAW_COMMAND,
} from './ExcalidrawPlugin';
export { excalidrawPluginTools } from './tools';
export { lexicalDrawingHost } from './host';
