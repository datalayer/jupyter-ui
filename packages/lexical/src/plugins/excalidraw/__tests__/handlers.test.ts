/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What the tools do to a drawing.
 *
 * The editor and Excalidraw itself are stood in for, which leaves exactly the
 * part worth testing: the bookkeeping between a caller's request and a scene
 * that Excalidraw will still agree with afterwards. Most of that bookkeeping
 * is about relationships the caller never mentions — an arrow is bound at
 * both ends *and* listed on both shapes, a label lives in a separate element
 * that has to be found, deleting a box has to take its label and detach its
 * arrows — and every one of those is a way for a drawing to end up subtly
 * wrong rather than obviously broken.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

/**
 * A node lookup that answers from a table this test controls.
 *
 * `$getNodeByKey` only works inside a real editor state, which is precisely
 * what is not here.
 */
const nodes = new Map<string, any>();
jest.mock('lexical', () => ({
  $getNodeByKey: (key: string) => nodes.get(key) ?? null,
}));

/**
 * A converter that behaves like Excalidraw's in the ways these handlers rely
 * on — it keeps the ids it is given, defaults a shape's size, and turns a
 * `label` into a bound text element — without pulling in the real one, which
 * is a browser bundle several megabytes wide.
 */
jest.mock(
  '@excalidraw/excalidraw',
  () => ({
    convertToExcalidrawElements: (skeletons: any[]) => {
      const out: any[] = [];
      for (const skeleton of skeletons) {
        const { label, start, end, ...rest } = skeleton;
        const element = {
          width: 100,
          height: 100,
          strokeColor: '#1e1e1e',
          version: 1,
          ...rest,
        };
        out.push(element);
        if (label?.text) {
          out.push({
            id: `${skeleton.id}-label`,
            type: 'text',
            text: label.text,
            containerId: skeleton.id,
            x: element.x,
            y: element.y,
            version: 1,
          });
          element.boundElements = [{ id: `${skeleton.id}-label`, type: 'text' }];
        }
      }
      return out;
    },
  }),
  { virtual: true },
);

import { excalidrawToolHandlers, __testing } from '../handlers';
import { parseScene, serializeScene, type ExcalidrawScene } from '../scene';

/** A stand-in for the one Excalidraw node the test is about. */
function makeDrawing(blockId: string, scene: Partial<ExcalidrawScene> = {}) {
  const node = {
    __data: serializeScene({
      elements: scene.elements ?? [],
      appState: scene.appState ?? {},
      files: scene.files ?? {},
    }),
    __width: 'inherit' as any,
    __height: 'inherit' as any,
    getType: () => 'excalidraw',
    setData(data: string) {
      this.__data = data;
    },
    setWidth(width: any) {
      this.__width = width;
    },
    setHeight(height: any) {
      this.__height = height;
    },
  };
  nodes.set(blockId, node);
  return node;
}

/** Just enough adapter for the handlers: an editor, and block insertion. */
function makeAdapter() {
  const inserted: any[] = [];
  return {
    inserted,
    editor: {
      getEditorState: () => ({ read: (fn: () => void) => fn() }),
      update: (fn: () => void, options?: { onUpdate?: () => void }) => {
        fn();
        options?.onUpdate?.();
      },
    },
    getBlocks: async () => [],
    insertBlock: async (block: any, afterId: string) => {
      inserted.push({ block, afterId });
      const blockId = `block-${inserted.length}`;
      makeDrawing(blockId).setData(block.metadata.data);
      return { success: true, blockId };
    },
  } as any;
}

const sceneOf = (blockId: string) => parseScene(nodes.get(blockId).__data);

/** One element by id, failing the test rather than the type-checker. */
function elementOf(blockId: string, id: string): any {
  const found = sceneOf(blockId).elements.find((e: any) => e.id === id);
  if (!found) {
    throw new Error(`No element '${id}' in drawing '${blockId}'`);
  }
  return found;
}

beforeEach(() => {
  nodes.clear();
});

describe('finding the drawing', () => {
  it('refuses a block id that is not a drawing, and says what it is', async () => {
    nodes.set('9', { getType: () => 'paragraph' });

    await expect(
      excalidrawToolHandlers.excalidrawReadScene(makeAdapter(), {
        blockId: '9',
      }),
    ).rejects.toThrow(/is a 'paragraph', not a drawing/);
  });

  it('refuses a block id that is nothing at all', async () => {
    await expect(
      excalidrawToolHandlers.excalidrawReadScene(makeAdapter(), {
        blockId: 'nope',
      }),
    ).rejects.toThrow(/No block 'nope'/);
  });
});

describe('drawing something new', () => {
  it('inserts a drawing and reports the ids it made', async () => {
    const adapter = makeAdapter();

    const result: any = await excalidrawToolHandlers.excalidrawInsertNode(
      adapter,
      {
        afterId: 'BOTTOM',
        elements: [
          { id: 'box', type: 'rectangle', x: 0, y: 0, label: 'Start' },
        ],
      },
    );

    expect(result.success).toBe(true);
    expect(result.createdIds).toEqual(['box']);
    expect(adapter.inserted[0].afterId).toBe('BOTTOM');
    expect(adapter.inserted[0].block.block_type).toBe('excalidraw');
    // The label became its own element, bound to the box.
    const scene = parseScene(adapter.inserted[0].block.metadata.data);
    expect(scene.elements.map((e: any) => e.type)).toEqual([
      'rectangle',
      'text',
    ]);
    expect(scene.elements[1].containerId).toBe('box');
  });

  it('keeps the id a caller chose, so the next call can use it', async () => {
    // Excalidraw's converter regenerates ids by default, which would make
    // every id a caller wrote meaningless one call later.
    const adapter = makeAdapter();
    const result: any = await excalidrawToolHandlers.excalidrawInsertNode(
      adapter,
      { afterId: 'TOP', elements: [{ id: 'mine', type: 'ellipse', x: 0, y: 0 }] },
    );

    expect(result.createdIds).toEqual(['mine']);
  });

  it('gives an unnamed element an id of its own', async () => {
    const adapter = makeAdapter();
    const result: any = await excalidrawToolHandlers.excalidrawInsertNode(
      adapter,
      { afterId: 'TOP', elements: [{ type: 'diamond', x: 0, y: 0 }] },
    );

    expect(result.createdIds[0]).toMatch(/^dla-/);
  });
});

describe('adding to a drawing that exists', () => {
  it('leaves what is already there alone', async () => {
    makeDrawing('1', { elements: [{ id: 'old', type: 'rectangle', x: 0, y: 0 }] });

    await excalidrawToolHandlers.excalidrawAddElements(makeAdapter(), {
      blockId: '1',
      elements: [{ id: 'new', type: 'ellipse', x: 200, y: 0 }],
    });

    expect(sceneOf('1').elements.map((e: any) => e.id)).toEqual(['old', 'new']);
  });

  it('will not let a new element overwrite an existing one', async () => {
    // A caller reusing an id it liked would otherwise silently replace a
    // shape somebody else drew.
    makeDrawing('1', { elements: [{ id: 'box', type: 'rectangle', x: 0, y: 0 }] });

    const result: any = await excalidrawToolHandlers.excalidrawAddElements(
      makeAdapter(),
      { blockId: '1', elements: [{ id: 'box', type: 'ellipse', x: 50, y: 0 }] },
    );

    expect(result.createdIds[0]).not.toBe('box');
    expect(sceneOf('1').elements).toHaveLength(2);
  });

  it('binds an arrow to shapes that were already in the drawing', async () => {
    /*
     * The converter can only bind within the batch it is handed, so an arrow
     * joining two shapes that are already on the canvas has to be bound
     * afterwards — otherwise it is a line that merely happens to sit between
     * them, and stays put when either is dragged.
     */
    makeDrawing('1', {
      elements: [
        { id: 'a', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: 'b', type: 'rectangle', x: 300, y: 0, width: 100, height: 100 },
      ],
    });

    const result: any = await excalidrawToolHandlers.excalidrawAddElements(
      makeAdapter(),
      {
        blockId: '1',
        elements: [
          { id: 'link', type: 'arrow', x: 0, y: 0, startId: 'a', endId: 'b' },
        ],
      },
    );

    const arrow = elementOf('1', result.createdIds[0]);
    expect(arrow.startBinding.elementId).toBe('a');
    expect(arrow.endBinding.elementId).toBe('b');
    // And both shapes know about it, which is what makes them drag it along.
    for (const id of ['a', 'b']) {
      expect(elementOf('1', id).boundElements).toContainEqual({
        id: arrow.id,
        type: 'arrow',
      });
    }
  });
});

describe('connecting two shapes', () => {
  beforeEach(() => {
    makeDrawing('1', {
      elements: [
        { id: 'a', type: 'rectangle', x: 0, y: 0, width: 100, height: 100 },
        { id: 'b', type: 'rectangle', x: 400, y: 0, width: 100, height: 100 },
      ],
    });
  });

  it('draws the arrow between their facing edges, not their centres', async () => {
    const result: any = await excalidrawToolHandlers.excalidrawConnectElements(
      makeAdapter(),
      { blockId: '1', fromId: 'a', toId: 'b' },
    );

    const arrow = elementOf('1', result.createdIds[0]);
    // Leaves 'a' at its right edge (100) plus the binding gap, and stops at
    // 'b' at its left edge (400) minus the gap.
    expect(arrow.x).toBeCloseTo(104, 0);
    expect(arrow.x + arrow.points[1][0]).toBeCloseTo(396, 0);
    // Horizontal, because the two boxes are level.
    expect(arrow.points[1][1]).toBeCloseTo(0, 0);
  });

  it('says which shape it could not find', async () => {
    await expect(
      excalidrawToolHandlers.excalidrawConnectElements(makeAdapter(), {
        blockId: '1',
        fromId: 'a',
        toId: 'ghost',
      }),
    ).rejects.toThrow(/No element 'ghost'/);
  });
});

describe('changing what is there', () => {
  it('moves and recolours by id, leaving the rest untouched', async () => {
    makeDrawing('1', {
      elements: [
        { id: 'a', type: 'rectangle', x: 0, y: 0, version: 3, roughness: 1 },
        { id: 'b', type: 'rectangle', x: 0, y: 0, version: 3 },
      ],
    });

    await excalidrawToolHandlers.excalidrawUpdateElements(makeAdapter(), {
      blockId: '1',
      updates: [{ id: 'a', x: 50, strokeColor: '#e03131' }],
    });

    const [a, b] = sceneOf('1').elements;
    expect(a.x).toBe(50);
    expect(a.strokeColor).toBe('#e03131');
    // Untouched fields survive, and the version moves on.
    expect(a.roughness).toBe(1);
    expect(a.version).toBe(4);
    expect(b.version).toBe(3);
  });

  it("rewrites a shape's label rather than writing text onto the shape", async () => {
    /*
     * "Rename this box" names the box, but the text is a different element.
     * Writing `text` onto a rectangle would produce a rectangle with a field
     * Excalidraw does not draw, and leave the old label showing.
     */
    makeDrawing('1', {
      elements: [
        { id: 'a', type: 'rectangle', x: 0, y: 0 },
        { id: 'a-label', type: 'text', text: 'Before', containerId: 'a' },
      ],
    });

    await excalidrawToolHandlers.excalidrawUpdateElements(makeAdapter(), {
      blockId: '1',
      updates: [{ id: 'a', text: 'After' }],
    });

    const [box, label] = sceneOf('1').elements;
    expect(box.text).toBeUndefined();
    expect(label.text).toBe('After');
    expect(label.originalText).toBe('After');
  });

  it('refuses the whole call when an id is wrong', async () => {
    // Half-applying a batch would leave a drawing nobody asked for.
    makeDrawing('1', { elements: [{ id: 'a', type: 'rectangle', x: 0, y: 0 }] });

    await expect(
      excalidrawToolHandlers.excalidrawUpdateElements(makeAdapter(), {
        blockId: '1',
        updates: [{ id: 'a', x: 10 }, { id: 'ghost', x: 10 }],
      }),
    ).rejects.toThrow(/No element\(s\) 'ghost'/);
    expect(sceneOf('1').elements[0].x).toBe(0);
  });
});

describe('taking things out', () => {
  it("takes a shape's label with it and detaches its arrows", async () => {
    makeDrawing('1', {
      elements: [
        {
          id: 'a',
          type: 'rectangle',
          x: 0,
          y: 0,
          boundElements: [
            { id: 'a-label', type: 'text' },
            { id: 'link', type: 'arrow' },
          ],
        },
        { id: 'a-label', type: 'text', text: 'Start', containerId: 'a' },
        { id: 'b', type: 'rectangle', x: 300, y: 0, boundElements: [{ id: 'link', type: 'arrow' }] },
        {
          id: 'link',
          type: 'arrow',
          x: 0,
          y: 0,
          startBinding: { elementId: 'a', focus: 0, gap: 4 },
          endBinding: { elementId: 'b', focus: 0, gap: 4 },
        },
      ],
    });

    await excalidrawToolHandlers.excalidrawDeleteElements(makeAdapter(), {
      blockId: '1',
      elementIds: ['a'],
    });

    // The box and its label are gone; the arrow and the other box remain.
    expect(sceneOf('1').elements.map((e: any) => e.id).sort()).toEqual([
      'b',
      'link',
    ]);
    const arrow = elementOf('1', 'link');
    expect(arrow.startBinding).toBeNull();
    expect(arrow.endBinding).toEqual({ elementId: 'b', focus: 0, gap: 4 });
    // And 'b' no longer claims an arrow bound to a shape that has gone.
    expect(elementOf('1', 'b').boundElements).toEqual([
      { id: 'link', type: 'arrow' },
    ]);
  });

  it('empties a drawing without removing it from the document', async () => {
    makeDrawing('1', { elements: [{ id: 'a', type: 'rectangle', x: 0, y: 0 }] });

    const result: any = await excalidrawToolHandlers.excalidrawClearScene(
      makeAdapter(),
      { blockId: '1' },
    );

    expect(result.elementCount).toBe(0);
    expect(nodes.get('1')).toBeDefined();
  });
});

describe('the canvas and the frame around it', () => {
  it('sets the background and turns the grid off with a zero', async () => {
    makeDrawing('1');

    await excalidrawToolHandlers.excalidrawSetAppState(makeAdapter(), {
      blockId: '1',
      viewBackgroundColor: '#fffbe6',
      gridSize: 0,
    });

    const { appState } = sceneOf('1');
    expect(appState.viewBackgroundColor).toBe('#fffbe6');
    // Excalidraw reads a falsy grid size as "no grid".
    expect(appState.gridSize).toBeNull();
  });

  it('sizes the drawing, and goes back to sizing by content', async () => {
    const node = makeDrawing('1');

    await excalidrawToolHandlers.excalidrawResize(makeAdapter(), {
      blockId: '1',
      width: 640,
      height: 480,
    });
    expect([node.__width, node.__height]).toEqual([640, 480]);

    await excalidrawToolHandlers.excalidrawResize(makeAdapter(), {
      blockId: '1',
    });
    expect([node.__width, node.__height]).toEqual(['inherit', 'inherit']);
  });
});

describe('where an arrow meets a box', () => {
  const box = (x: number, y: number) => ({
    id: 'x',
    type: 'rectangle',
    x,
    y,
    width: 100,
    height: 100,
  });

  it('leaves through the side it is heading for', () => {
    // Straight right: out of the right edge, level with the centre.
    const point = __testing.edgePoint(box(0, 0), { x: 500, y: 50 });
    expect(point.x).toBeCloseTo(104, 0);
    expect(point.y).toBeCloseTo(50, 0);
  });

  it('leaves through the top when the target is above', () => {
    const point = __testing.edgePoint(box(0, 0), { x: 50, y: -500 });
    expect(point.x).toBeCloseTo(50, 0);
    expect(point.y).toBeCloseTo(-4, 0);
  });

  it('gives up gracefully on two shapes in the same place', () => {
    const point = __testing.edgePoint(box(0, 0), { x: 50, y: 50 });
    expect(point).toEqual({ x: 50, y: 50 });
  });
});
