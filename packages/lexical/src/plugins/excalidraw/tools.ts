/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Excalidraw tools, as the plugin hands them to a document.
 *
 * What the model is told and what validates a call come from
 * `@datalayer/reactor-excalidraw`; what is Lexical's is where the drawings
 * are ({@link lexicalDrawingHost}) and the Excalidraw that converts shapes,
 * imported when a call needs it: it is a very large dependency, and a
 * document that never draws anything should not pay for it.
 *
 * @module plugins/excalidraw/tools
 */

import {
  createExcalidrawToolHandlers,
  excalidrawTools,
  type ExcalidrawConverters,
} from '@datalayer/reactor-excalidraw';

import type {
  LexicalPluginTools,
  LexicalToolHandler,
} from '../../tools/core/pluginTools';
import type { LexicalAdapter } from '../../state/LexicalAdapter';
import { lexicalDrawingHost } from './host';

/** The operations that turn shapes into Excalidraw elements. */
const CONVERTING = new Set([
  'excalidrawInsertNode',
  'excalidrawAddElements',
  'excalidrawConnectElements',
  'excalidrawFromMermaid',
]);

/** Excalidraw's conversions, loaded on first use. */
async function loadConverters(): Promise<ExcalidrawConverters> {
  const { convertToExcalidrawElements } =
    await import('@excalidraw/excalidraw');
  return {
    convertToExcalidrawElements: (skeletons, options) =>
      convertToExcalidrawElements(skeletons as any, options as any) as any,
    parseMermaidToExcalidraw: async (source, options) => {
      const { parseMermaidToExcalidraw } =
        await import('@excalidraw/mermaid-to-excalidraw');
      return parseMermaidToExcalidraw(source, options as any) as any;
    },
  };
}

/** What an operation that converts nothing is given instead. */
const NOT_CONVERTING: ExcalidrawConverters = {
  convertToExcalidrawElements: () => {
    throw new Error('This operation converts no shapes.');
  },
};

/** One handler per operation, over the document the call is about. */
const handlers: Record<string, LexicalToolHandler> = Object.fromEntries(
  Object.keys(excalidrawTools.operations).map(operation => [
    operation,
    async (adapter: LexicalAdapter, args: Record<string, unknown>) => {
      const converters = CONVERTING.has(operation)
        ? await loadConverters()
        : NOT_CONVERTING;
      return createExcalidrawToolHandlers(
        lexicalDrawingHost(adapter),
        converters,
      )[operation](args);
    },
  ]),
);

/** Everything the plugin contributes while it is mounted. */
export const excalidrawPluginTools: LexicalPluginTools = {
  name: excalidrawTools.name,
  definitions: excalidrawTools.definitions,
  operations: excalidrawTools.operations,
  handlers,
};
