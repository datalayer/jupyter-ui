/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * How a drawing looks in a listing of blocks.
 *
 * `readAllBlocks` is how an agent first meets a document, and its preview of
 * each block is what it decides from. Every drawing anybody had actually
 * drawn previewed as "(empty diagram)": the preview read the node's data as a
 * bare array of elements, which is the shape a *new* node has and never the
 * shape a saved one does.
 */

import { describe, expect, it } from '@jest/globals';

import { generatePreview } from '../../../tools/utils/blocks';

const drawing = (data: unknown) => ({
  block_id: '1',
  block_type: 'excalidraw',
  source: '',
  metadata: { data: JSON.stringify(data) },
});

describe('previewing a drawing', () => {
  it('says what a saved drawing holds', () => {
    // The shape `ExcalidrawComponent.setData` writes — the one that was
    // previewing as empty.
    const preview = generatePreview(
      drawing({
        elements: [
          { id: 'a', type: 'rectangle' },
          { id: 'b', type: 'rectangle' },
          { id: 'c', type: 'arrow' },
          { id: 't', type: 'text', text: 'Ingest', containerId: 'a' },
        ],
        appState: {},
        files: {},
      }) as any,
    );

    expect(preview).toBe('2 rectangles, 1 arrow: Ingest');
  });

  it('still reads a drawing stored as a bare array', () => {
    expect(
      generatePreview(drawing([{ id: 'a', type: 'ellipse' }]) as any),
    ).toBe('1 ellipse');
  });

  it('says a drawing is empty only when it is', () => {
    expect(generatePreview(drawing([]) as any)).toBe('(empty diagram)');
    expect(
      generatePreview(
        drawing({ elements: [], appState: {}, files: {} }) as any,
      ),
    ).toBe('(empty diagram)');
  });
});
