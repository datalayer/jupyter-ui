/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Reading and describing a drawing.
 *
 * The scene model is the part of this feature that has to be right without a
 * browser: every tool that reads a drawing goes through it, and the block
 * preview does too. It is also where the one real bug in the existing code
 * was — a node's data has two shapes in the wild, and only one of them was
 * ever read.
 */

import { describe, expect, it } from '@jest/globals';

import {
  describeScene,
  liveElements,
  parseScene,
  serializeScene,
  summarizeElement,
  touchElement,
  withBoundText,
} from '../scene';

/** What the modal writes when somebody saves a drawing. */
const saved = (elements: Record<string, any>[]) =>
  JSON.stringify({ elements, appState: { viewBackgroundColor: '#fff' }, files: {} });

describe('reading what a node holds', () => {
  it('reads the shape a saved drawing has', () => {
    /*
     * This is the case that was broken. `ExcalidrawComponent.setData` writes
     * `{elements, appState, files}`, so every drawing anybody has drawn is an
     * object — and the block preview only handled the array.
     */
    const scene = parseScene(saved([{ id: 'a', type: 'rectangle' }]));

    expect(scene.elements).toHaveLength(1);
    expect(scene.appState.viewBackgroundColor).toBe('#fff');
  });

  it("reads the shape a node starts life with", () => {
    // `$createExcalidrawNode()` defaults to the string '[]'.
    expect(parseScene('[]').elements).toEqual([]);
    expect(parseScene(JSON.stringify([{ id: 'a', type: 'ellipse' }])).elements)
      .toHaveLength(1);
  });

  it('reads nothing as an empty drawing rather than throwing', () => {
    // A tool that threw here would fail on a document the editor opens fine.
    for (const data of ['', undefined, null, 'not json', '"a string"', '42']) {
      expect(parseScene(data as any)).toEqual({
        elements: [],
        appState: {},
        files: {},
      });
    }
  });

  it('writes back the shape the editor reads', () => {
    const scene = parseScene('[]');
    scene.elements = [{ id: 'a', type: 'rectangle' }];

    const written = JSON.parse(serializeScene(scene));
    expect(written.elements).toHaveLength(1);
    expect(written).toHaveProperty('appState');
    expect(written).toHaveProperty('files');
  });

  it('ignores elements Excalidraw has tombstoned', () => {
    const scene = parseScene(
      saved([
        { id: 'a', type: 'rectangle' },
        { id: 'b', type: 'rectangle', isDeleted: true },
      ]),
    );

    expect(liveElements(scene).map(element => element.id)).toEqual(['a']);
  });
});

describe('describing a drawing', () => {
  it('says what is in it and what it says', () => {
    const scene = parseScene(
      saved([
        { id: 'a', type: 'rectangle' },
        { id: 'b', type: 'rectangle' },
        { id: 'c', type: 'arrow' },
        { id: 't', type: 'text', text: 'Start', containerId: 'a' },
      ]),
    );

    expect(describeScene(scene)).toBe('2 rectangles, 1 arrow: Start');
  });

  it('says so when there is nothing in it', () => {
    expect(describeScene(parseScene('[]'))).toBe('empty drawing');
  });
});

describe('summarising an element', () => {
  it('keeps what can be acted on and drops what cannot', () => {
    const summary = summarizeElement({
      id: 'a',
      type: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      strokeColor: '#1e1e1e',
      // The noise: none of this should reach a model.
      seed: 12345,
      versionNonce: 987,
      index: 'a1',
      roughness: 1,
    });

    expect(summary).toEqual({
      id: 'a',
      type: 'rectangle',
      x: 10,
      y: 20,
      width: 100,
      height: 50,
      strokeColor: '#1e1e1e',
    });
  });

  it('reports what an arrow is attached to', () => {
    const summary = summarizeElement({
      id: 'arrow',
      type: 'arrow',
      startBinding: { elementId: 'a', focus: 0, gap: 4 },
      endBinding: { elementId: 'b', focus: 0, gap: 4 },
    });

    expect(summary.startBoundElementId).toBe('a');
    expect(summary.endBoundElementId).toBe('b');
  });

  it('lends a container the text bound inside it', () => {
    /*
     * A labelled rectangle is two elements, and reading only the rectangle
     * tells you nothing about what it is called — which is the one thing
     * worth knowing when deciding which box to change.
     */
    const [box, label] = withBoundText([
      { id: 'a', type: 'rectangle', x: 0, y: 0, width: 100, height: 50 },
      { id: 't', type: 'text', text: 'Start', containerId: 'a' },
    ]);

    expect(box.text).toBe('Start');
    expect(label.containerId).toBe('a');
  });
});

describe('marking an element changed', () => {
  it('moves the version on, so a collaborator keeps the edit', () => {
    // Excalidraw reconciles by version; writing back the old one invites
    // another client to discard the change.
    const before = { id: 'a', type: 'rectangle', version: 7, versionNonce: 1 };
    const after = touchElement(before);

    expect(after.version).toBe(8);
    expect(after.versionNonce).not.toBe(before.versionNonce);
    expect(after.updated).toBeGreaterThan(0);
    // The original is untouched: nothing here mutates in place.
    expect(before.version).toBe(7);
  });

  it('starts a version off for an element that had none', () => {
    expect(touchElement({ id: 'a' }).version).toBe(2);
  });
});
