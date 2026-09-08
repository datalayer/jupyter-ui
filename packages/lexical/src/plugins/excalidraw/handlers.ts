/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The half of the Excalidraw tools that touches the drawing.
 *
 * These run in the browser, against a live editor, and are reached through
 * the executor rather than called directly: an operation in `operations.ts`
 * validates what it was given, the executor finds the handler registered for
 * that operation on that document, and this is what it finds.
 *
 * Two rules shape everything here.
 *
 * **Ids are the contract.** Excalidraw's own converter regenerates element
 * ids by default, which would mean the ids a caller wrote in one call meant
 * nothing in the next. Every skeleton is given an explicit id before
 * conversion and converted with `regenerateIds: false`, so an id a caller
 * chose — or read back from a scene — keeps working.
 *
 * **Bindings are not decoration.** An arrow between two shapes in Excalidraw
 * is not a line that happens to touch them: it is bound at both ends, and
 * each shape lists it in `boundElements`. Get that wrong and the arrow looks
 * right until somebody drags a box, at which point it stays behind. So
 * arrows between existing elements go through `bindArrow`, which writes both
 * halves of the relationship and computes the geometry.
 *
 * Excalidraw itself is imported dynamically. It is a very large dependency,
 * and a document that never draws anything should not pay for it.
 *
 * @module plugins/excalidraw/handlers
 */

import { $getNodeByKey } from 'lexical';
import type { LexicalEditor } from 'lexical';

import type { LexicalToolHandler } from '../../tools/core/pluginTools';
import type { LexicalAdapter } from '../../state/LexicalAdapter';
import {
  describeScene,
  liveElements,
  parseScene,
  serializeScene,
  touchElement,
  withBoundText,
  type ExcalidrawElementData,
  type ExcalidrawScene,
} from './scene';

/** Excalidraw's default gap between a shape and an arrow bound to it. */
const BINDING_GAP = 4;

/** How wide a shape is drawn when nobody said. Matches Excalidraw's own. */
const DEFAULT_DIMENSION = 100;

// ============================================================================
// Reaching the node
// ============================================================================

/**
 * The Excalidraw node a `blockId` names.
 *
 * Throws rather than returning null: every one of these tools is useless
 * without it, and a caller that passed the id of a paragraph needs to be told
 * that rather than handed an empty scene.
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

/** The scene a node holds. */
function readScene(editor: LexicalEditor, blockId: string): ExcalidrawScene {
  const node = requireNode(editor, blockId);
  let data = '';
  editor.getEditorState().read(() => {
    data = node.__data ?? '';
  });
  return parseScene(data);
}

/** Write a scene back, as one editor update. */
function writeScene(
  editor: LexicalEditor,
  blockId: string,
  scene: ExcalidrawScene,
): Promise<void> {
  const serialized = serializeScene(scene);
  return new Promise(resolve => {
    editor.update(
      () => {
        const node: any = $getNodeByKey(blockId);
        if (node?.setData) {
          node.setData(serialized);
        }
      },
      { onUpdate: () => resolve() },
    );
  });
}

/** The answer every mutating tool gives. */
const sceneResult = (
  blockId: string,
  scene: ExcalidrawScene,
  extra?: Record<string, unknown>,
) => ({
  success: true,
  blockId,
  elementCount: liveElements(scene).length,
  ...extra,
});

// ============================================================================
// Skeletons into elements
// ============================================================================

/** Ids we hand out when the caller did not name an element. */
let generated = 0;
const newId = (): string =>
  `dla-${Date.now().toString(36)}-${(generated += 1).toString(36)}`;

/**
 * Turn the tool's element shape into the one Excalidraw's converter takes.
 *
 * The tool's shape is flatter on purpose — `label` instead of
 * `label: {text}`, `startId` instead of `start: {id}` — because a flat
 * parameter is one a model gets right first time. This is where that is
 * traded back.
 */
function toSkeleton(
  element: Record<string, any>,
  id: string,
): Record<string, any> {
  const {
    label,
    startId,
    endId,
    fontSize,
    text,
    children,
    name,
    ...rest
  } = element;

  const skeleton: Record<string, any> = { ...rest, id };

  if (element.type === 'text') {
    skeleton.text = text ?? label ?? '';
    if (fontSize) {
      skeleton.fontSize = fontSize;
    }
  } else if (label) {
    skeleton.label = fontSize ? { text: label, fontSize } : { text: label };
  }

  if (element.type === 'arrow' || element.type === 'line') {
    // Only ids that belong to this batch can be resolved by the converter;
    // anything else is bound afterwards, against the live scene.
    if (startId) {
      skeleton.start = { id: startId };
    }
    if (endId) {
      skeleton.end = { id: endId };
    }
  }

  if (element.type === 'frame' || element.type === 'magicframe') {
    skeleton.children = children ?? [];
    if (name) {
      skeleton.name = name;
    }
  }

  return skeleton;
}

/**
 * Convert a batch of tool elements into real Excalidraw elements.
 *
 * Returns the elements and the ids they were given, in the order they were
 * asked for, so a caller can say what it made.
 */
async function convertElements(
  elements: Record<string, any>[],
  existingIds: Set<string>,
): Promise<{ elements: ExcalidrawElementData[]; ids: string[] }> {
  const { convertToExcalidrawElements } = await import(
    '@excalidraw/excalidraw'
  );

  const ids: string[] = [];
  const skeletons = elements.map(element => {
    // An id the caller chose is kept — that is how they refer to it next
    // time — unless the drawing already has one, in which case keeping it
    // would overwrite an existing element.
    let id = String(element.id ?? '').trim();
    if (!id || existingIds.has(id)) {
      id = newId();
    }
    existingIds.add(id);
    ids.push(id);
    return toSkeleton(element, id);
  });

  const converted = convertToExcalidrawElements(skeletons as any, {
    regenerateIds: false,
  }) as unknown as ExcalidrawElementData[];

  return { elements: [...converted], ids };
}

// ============================================================================
// Arrows between shapes
// ============================================================================

/** The centre of an element. */
const centreOf = (element: ExcalidrawElementData) => ({
  x: Number(element.x ?? 0) + Number(element.width ?? 0) / 2,
  y: Number(element.y ?? 0) + Number(element.height ?? 0) / 2,
});

/**
 * Where a line from `from` to `towards` leaves `from`'s box.
 *
 * Excalidraw recomputes this itself the moment anybody drags either shape;
 * what it needs from us is a starting geometry that already looks right, so
 * the drawing is correct before it is ever touched.
 */
function edgePoint(
  from: ExcalidrawElementData,
  towards: { x: number; y: number },
): { x: number; y: number } {
  const centre = centreOf(from);
  const dx = towards.x - centre.x;
  const dy = towards.y - centre.y;
  if (dx === 0 && dy === 0) {
    return centre;
  }
  const halfWidth = Number(from.width ?? 0) / 2 + BINDING_GAP;
  const halfHeight = Number(from.height ?? 0) / 2 + BINDING_GAP;
  // Scale the direction until it touches whichever side it reaches first.
  const scale = Math.min(
    dx === 0 ? Infinity : Math.abs(halfWidth / dx),
    dy === 0 ? Infinity : Math.abs(halfHeight / dy),
  );
  return { x: centre.x + dx * scale, y: centre.y + dy * scale };
}

/** Note on a shape that an arrow is attached to it. */
function addBoundElement(
  element: ExcalidrawElementData,
  arrowId: string,
): ExcalidrawElementData {
  const bound = Array.isArray(element.boundElements)
    ? [...element.boundElements]
    : [];
  if (!bound.some((entry: any) => entry?.id === arrowId)) {
    bound.push({ id: arrowId, type: 'arrow' });
  }
  return touchElement({ ...element, boundElements: bound });
}

/**
 * Bind an arrow to the two elements it runs between, in the live scene.
 *
 * Both halves: the arrow's `startBinding`/`endBinding`, and each shape's
 * `boundElements`. Excalidraw needs both — the first is how the arrow finds
 * its shapes, the second is how a shape knows to drag its arrows along.
 */
function bindArrow(
  scene: ExcalidrawScene,
  arrow: ExcalidrawElementData,
  fromId: string,
  toId: string,
): ExcalidrawElementData {
  const from = scene.elements.find(element => element.id === fromId);
  const to = scene.elements.find(element => element.id === toId);
  if (!from || !to) {
    const missing = !from ? fromId : toId;
    throw new Error(
      `No element '${missing}' in this drawing. ` +
        'Call excalidrawReadScene to see the element ids it holds.',
    );
  }

  const start = edgePoint(from, centreOf(to));
  const end = edgePoint(to, centreOf(from));

  const bound = {
    ...arrow,
    x: start.x,
    y: start.y,
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
    points: [
      [0, 0],
      [end.x - start.x, end.y - start.y],
    ],
    startBinding: { elementId: fromId, focus: 0, gap: BINDING_GAP },
    endBinding: { elementId: toId, focus: 0, gap: BINDING_GAP },
  };

  scene.elements = scene.elements.map(element => {
    if (element.id === fromId || element.id === toId) {
      return addBoundElement(element, String(arrow.id));
    }
    return element;
  });

  return bound;
}

// ============================================================================
// The handlers
// ============================================================================

const insertNode: LexicalToolHandler = async (adapter: LexicalAdapter, args) => {
  const elements = (args.elements as Record<string, any>[]) ?? [];
  const converted =
    elements.length > 0
      ? await convertElements(elements, new Set())
      : { elements: [], ids: [] };

  const scene: ExcalidrawScene = {
    elements: converted.elements,
    appState: {},
    files: {},
  };

  const result = await adapter.insertBlock(
    {
      block_id: '',
      block_type: 'excalidraw',
      source: '',
      metadata: {
        data: serializeScene(scene),
        width: args.width as number | undefined,
        height: args.height as number | undefined,
      },
    },
    String(args.afterId ?? 'BOTTOM'),
  );

  if (!result.success || !result.blockId) {
    throw new Error(result.error || 'Failed to insert the drawing');
  }

  return sceneResult(result.blockId, scene, {
    createdIds: converted.ids,
    message: `Drawing inserted with ${converted.elements.length} element(s)`,
  });
};

const listDrawings: LexicalToolHandler = async (adapter: LexicalAdapter) => {
  const blocks = (await adapter.getBlocks('detailed')) as any[];
  const drawings = blocks
    .filter(block => block.block_type === 'excalidraw')
    .map(block => {
      const scene = parseScene(block.metadata?.data as string);
      return {
        blockId: block.block_id,
        elementCount: liveElements(scene).length,
        description: describeScene(scene),
        width: block.metadata?.width as number | undefined,
        height: block.metadata?.height as number | undefined,
      };
    });
  return { drawings, count: drawings.length };
};

const readSceneHandler: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const live = liveElements(scene);
  return {
    blockId,
    elementCount: live.length,
    elements: args.detail === 'full' ? live : withBoundText(live),
    appState: scene.appState,
    description: describeScene(scene),
  };
};

const addElements: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const existingIds = new Set(scene.elements.map(element => String(element.id)));
  const asked = (args.elements as Record<string, any>[]) ?? [];

  /*
   * An arrow whose ends name shapes already in the drawing cannot be bound by
   * the converter, which only knows about the batch it was handed. Those are
   * converted plainly and bound afterwards, against the live scene.
   */
  const batchIds = new Set(
    asked.map(element => String(element.id ?? '')).filter(Boolean),
  );
  const deferred = new Map<number, { fromId: string; toId: string }>();
  const prepared = asked.map((element, index) => {
    const { startId, endId } = element;
    const crossesBatch =
      (element.type === 'arrow' || element.type === 'line') &&
      startId &&
      endId &&
      (!batchIds.has(String(startId)) || !batchIds.has(String(endId)));
    if (crossesBatch) {
      deferred.set(index, { fromId: String(startId), toId: String(endId) });
      const { startId: _s, endId: _e, ...rest } = element;
      return rest;
    }
    return element;
  });

  const converted = await convertElements(prepared, existingIds);
  scene.elements = [...scene.elements, ...converted.elements];

  for (const [index, ends] of deferred) {
    const arrowId = converted.ids[index];
    const arrow = scene.elements.find(element => element.id === arrowId);
    if (arrow) {
      const boundArrow = bindArrow(scene, arrow, ends.fromId, ends.toId);
      scene.elements = scene.elements.map(element =>
        element.id === arrowId ? boundArrow : element,
      );
    }
  }

  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, {
    createdIds: converted.ids,
    message: `Added ${converted.elements.length} element(s)`,
  });
};

const updateElements: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const updates = (args.updates as Record<string, any>[]) ?? [];

  // A shape's text lives in a separate element bound inside it, so "set the
  // text of this rectangle" has to be redirected to that element.
  const boundTextOf = new Map<string, string>();
  for (const element of scene.elements) {
    if (element?.type === 'text' && element?.containerId) {
      boundTextOf.set(String(element.containerId), String(element.id));
    }
  }

  const byId = new Map<string, Record<string, any>>();
  const missing: string[] = [];
  for (const update of updates) {
    const id = String(update.id);
    const target = scene.elements.find(element => element.id === id);
    if (!target) {
      missing.push(id);
      continue;
    }
    const { id: _ignored, text, ...fields } = update;
    const redirect = target.type !== 'text' && boundTextOf.get(id);
    if (text !== undefined) {
      if (redirect) {
        byId.set(redirect, { ...(byId.get(redirect) ?? {}), text, originalText: text });
      } else {
        fields.text = text;
        fields.originalText = text;
      }
    }
    if (Object.keys(fields).length > 0) {
      byId.set(id, { ...(byId.get(id) ?? {}), ...fields });
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `No element(s) ${missing.map(id => `'${id}'`).join(', ')} in this drawing. ` +
        'Call excalidrawReadScene to see the element ids it holds.',
    );
  }

  scene.elements = scene.elements.map(element => {
    const fields = byId.get(String(element.id));
    return fields ? touchElement({ ...element, ...fields }) : element;
  });

  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, {
    message: `Updated ${updates.length} element(s)`,
  });
};

const deleteElements: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const asked = new Set((args.elementIds as string[]).map(String));

  // Text bound inside a deleted shape goes with it; an orphaned label would
  // hang in mid-air where its box used to be.
  const removed = new Set(asked);
  for (const element of scene.elements) {
    if (element?.containerId && asked.has(String(element.containerId))) {
      removed.add(String(element.id));
    }
  }

  const before = scene.elements.length;
  scene.elements = scene.elements
    .filter(element => !removed.has(String(element.id)))
    // An arrow that pointed at a deleted shape keeps its shape but loses the
    // binding, and every survivor forgets the arrows that went with it.
    .map(element => {
      const patch: Record<string, any> = {};
      if (removed.has(String(element.startBinding?.elementId))) {
        patch.startBinding = null;
      }
      if (removed.has(String(element.endBinding?.elementId))) {
        patch.endBinding = null;
      }
      if (Array.isArray(element.boundElements)) {
        const kept = element.boundElements.filter(
          (entry: any) => !removed.has(String(entry?.id)),
        );
        if (kept.length !== element.boundElements.length) {
          patch.boundElements = kept;
        }
      }
      return Object.keys(patch).length > 0
        ? touchElement({ ...element, ...patch })
        : element;
    });

  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, {
    message: `Removed ${before - scene.elements.length} element(s)`,
  });
};

const connectElements: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const fromId = String(args.fromId);
  const toId = String(args.toId);

  const existingIds = new Set(scene.elements.map(element => String(element.id)));
  const { elements: made, ids } = await convertElements(
    [
      {
        type: 'arrow',
        x: 0,
        y: 0,
        ...(args.label ? { label: args.label } : {}),
        ...(args.strokeColor ? { strokeColor: args.strokeColor } : {}),
        ...(args.strokeStyle ? { strokeStyle: args.strokeStyle } : {}),
      },
    ],
    existingIds,
  );

  const arrowId = ids[0];
  scene.elements = [...scene.elements, ...made];
  const arrow = scene.elements.find(element => element.id === arrowId);
  const bound = bindArrow(scene, arrow as ExcalidrawElementData, fromId, toId);
  scene.elements = scene.elements.map(element =>
    element.id === arrowId ? bound : element,
  );

  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, {
    createdIds: [arrowId],
    message: `Connected '${fromId}' to '${toId}'`,
  });
};

const setAppState: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  if (args.viewBackgroundColor !== undefined) {
    scene.appState.viewBackgroundColor = args.viewBackgroundColor;
  }
  if (args.gridSize !== undefined) {
    // Excalidraw reads a falsy grid size as "no grid", which is what 0 means
    // to a caller.
    scene.appState.gridSize = Number(args.gridSize) || null;
  }
  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, { message: 'Canvas updated' });
};

const resize: LexicalToolHandler = async (adapter: LexicalAdapter, args) => {
  const blockId = String(args.blockId);
  const node = requireNode(adapter.editor, blockId);
  const width = args.width === undefined ? 'inherit' : Number(args.width);
  const height = args.height === undefined ? 'inherit' : Number(args.height);

  await new Promise<void>(resolve => {
    adapter.editor.update(
      () => {
        node.setWidth(width);
        node.setHeight(height);
      },
      { onUpdate: () => resolve() },
    );
  });

  const scene = readScene(adapter.editor, blockId);
  return sceneResult(blockId, scene, {
    message:
      width === 'inherit' && height === 'inherit'
        ? 'Drawing sized to its content'
        : `Drawing sized to ${width} x ${height}`,
  });
};

const clearScene: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const blockId = String(args.blockId);
  const scene = readScene(adapter.editor, blockId);
  const removed = liveElements(scene).length;
  scene.elements = [];
  scene.files = {};
  await writeScene(adapter.editor, blockId, scene);
  return sceneResult(blockId, scene, {
    message: `Emptied the drawing (${removed} element(s) removed)`,
  });
};

const fromMermaid: LexicalToolHandler = async (
  adapter: LexicalAdapter,
  args,
) => {
  const { parseMermaidToExcalidraw } = await import(
    '@excalidraw/mermaid-to-excalidraw'
  );
  const { convertToExcalidrawElements } = await import(
    '@excalidraw/excalidraw'
  );

  let parsed;
  try {
    parsed = await parseMermaidToExcalidraw(String(args.mermaid), {
      fontSize: args.fontSize ? Number(args.fontSize) : undefined,
    } as any);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `That Mermaid source did not parse: ${message}. ` +
        'Flowcharts, sequence diagrams and class diagrams are the ones that convert to shapes.',
    );
  }

  const elements = [
    ...(convertToExcalidrawElements(
      parsed.elements as any,
    ) as unknown as ExcalidrawElementData[]),
  ];
  const files = (parsed.files ?? {}) as Record<string, any>;

  // Replacing a drawing, or making one.
  if (args.blockId) {
    const blockId = String(args.blockId);
    const scene = readScene(adapter.editor, blockId);
    scene.elements = elements;
    scene.files = files;
    await writeScene(adapter.editor, blockId, scene);
    return sceneResult(blockId, scene, {
      createdIds: elements.map(element => String(element.id)),
      message: `Drawing replaced with ${elements.length} element(s) from Mermaid`,
    });
  }

  const scene: ExcalidrawScene = { elements, appState: {}, files };
  const result = await adapter.insertBlock(
    {
      block_id: '',
      block_type: 'excalidraw',
      source: '',
      metadata: { data: serializeScene(scene) },
    },
    String(args.afterId ?? 'BOTTOM'),
  );
  if (!result.success || !result.blockId) {
    throw new Error(result.error || 'Failed to insert the drawing');
  }
  return sceneResult(result.blockId, scene, {
    createdIds: elements.map(element => String(element.id)),
    message: `Drawing inserted with ${elements.length} element(s) from Mermaid`,
  });
};

/**
 * Every Excalidraw handler, keyed by the operation the executor looks up.
 */
export const excalidrawToolHandlers: Record<string, LexicalToolHandler> = {
  excalidrawInsertNode: insertNode,
  excalidrawListDrawings: listDrawings,
  excalidrawReadScene: readSceneHandler,
  excalidrawAddElements: addElements,
  excalidrawUpdateElements: updateElements,
  excalidrawDeleteElements: deleteElements,
  excalidrawConnectElements: connectElements,
  excalidrawSetAppState: setAppState,
  excalidrawResize: resize,
  excalidrawClearScene: clearScene,
  excalidrawFromMermaid: fromMermaid,
};

/** Exported for the tests, which check the geometry without a browser. */
export const __testing = {
  bindArrow,
  edgePoint,
  toSkeleton,
  DEFAULT_DIMENSION,
};
