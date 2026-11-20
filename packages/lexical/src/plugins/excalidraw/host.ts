/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A Lexical document as the place the Excalidraw tools keep their drawings.
 *
 * The tools live in `@datalayer/reactor-excalidraw` and know nothing of any
 * editor; they ask a host. Here a drawing is an `ExcalidrawNode`, its id is
 * the node's key (the block_id every block tool uses), its scene is the
 * node's `data` string, and a new drawing is a block inserted where the
 * caller said.
 *
 * @module plugins/excalidraw/host
 */

import { $getNodeByKey } from 'lexical';
import type { LexicalEditor } from 'lexical';
import {
  parseScene,
  serializeScene,
  type ExcalidrawDrawingHost,
  type ExcalidrawScene,
} from '@datalayer/reactor-excalidraw';

import type { LexicalAdapter } from '../../state/LexicalAdapter';

/**
 * The Excalidraw node a `blockId` names.
 *
 * Throws rather than returning null: every tool is useless without it, and a
 * caller that passed the id of a paragraph needs to be told that rather than
 * handed an empty scene.
 */
function requireNode(editor: LexicalEditor, blockId: string): any {
  let node: any = null;
  let type: string | undefined;
  editor.getEditorState().read(() => {
    const found: any = $getNodeByKey(blockId);
    if (found) {
      type = found.getType?.();
      if (type === 'excalidraw') {
        node = found;
      }
    }
  });
  if (!node) {
    throw new Error(
      type
        ? `Block '${blockId}' is a '${type}', not a drawing. ` +
            'Call excalidrawListDrawings to find the drawings in this document.'
        : `No block '${blockId}' in this document. ` +
            'Call excalidrawListDrawings to find the drawings in this document.',
    );
  }
  return node;
}

/** Run one editor update and wait for it to land. */
function update(editor: LexicalEditor, fn: () => void): Promise<void> {
  return new Promise(resolve => {
    editor.update(fn, { onUpdate: () => resolve() });
  });
}

/** One host per document: the package queues a drawing's edits by host. */
const HOSTS = new WeakMap<LexicalAdapter, ExcalidrawDrawingHost>();

/**
 * The drawings of the document an adapter is for: the same host for every
 * call on that document, so that two calls on one drawing at once wait for
 * each other (`serializeDrawingEdit`) rather than one write dropping the
 * other's change.
 */
export function lexicalDrawingHost(
  adapter: LexicalAdapter,
): ExcalidrawDrawingHost {
  let host = HOSTS.get(adapter);
  if (!host) {
    host = buildHost(adapter);
    HOSTS.set(adapter, host);
  }
  return host;
}

function buildHost(adapter: LexicalAdapter): ExcalidrawDrawingHost {
  const editor = adapter.editor;
  return {
    listDrawings: async () => {
      const blocks = (await adapter.getBlocks('detailed')) as any[];
      return blocks
        .filter(block => block.block_type === 'excalidraw')
        .map(block => ({
          id: String(block.block_id),
          scene: parseScene(block.metadata?.data as string),
          width: block.metadata?.width as number | undefined,
          height: block.metadata?.height as number | undefined,
        }));
    },

    readDrawing: async (blockId: string): Promise<ExcalidrawScene> => {
      const node = requireNode(editor, blockId);
      let data = '';
      editor.getEditorState().read(() => {
        data = node.__data ?? '';
      });
      return parseScene(data);
    },

    writeDrawing: async (blockId: string, scene: ExcalidrawScene) => {
      requireNode(editor, blockId);
      const serialized = serializeScene(scene);
      await update(editor, () => {
        const node: any = $getNodeByKey(blockId);
        node.setData(serialized);
      });
    },

    insertDrawing: async (scene, placement) => {
      const result = await adapter.insertBlock(
        {
          block_id: '',
          block_type: 'excalidraw',
          source: '',
          metadata: {
            data: serializeScene(scene),
            width: placement.width,
            height: placement.height,
          },
        },
        placement.afterId ?? 'BOTTOM',
      );
      if (!result.success || !result.blockId) {
        throw new Error(result.error || 'Failed to insert the drawing');
      }
      return result.blockId;
    },

    resizeDrawing: async (blockId, width, height) => {
      const node = requireNode(editor, blockId);
      await update(editor, () => {
        node.setWidth(width);
        node.setHeight(height);
      });
    },
  };
}
