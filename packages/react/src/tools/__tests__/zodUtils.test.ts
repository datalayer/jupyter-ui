/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Zod → JSON Schema conversion every tool definition goes through.
 *
 * This is the only description of a tool the model ever sees: the Zod schema
 * stays in the process, the JSON Schema is what crosses the wire. So anything
 * the conversion flattens is a parameter the model has to guess at, and the
 * two things it used to flatten were the ones that matter most for a tool
 * whose input is more than a bag of scalars — the shape of an array's
 * elements, and the properties of a nested object.
 */

import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';

import { zodToToolParameters } from '../core/zodUtils';

describe('what the model is told a tool takes', () => {
  it('describes the elements of an array, not just that it is an array', () => {
    const schema = z.object({
      elements: z
        .array(
          z.object({
            type: z.enum(['rectangle', 'ellipse']).describe('Shape'),
            x: z.number(),
            label: z.string().optional(),
          }),
        )
        .describe('The shapes to draw'),
    });

    const parameters = zodToToolParameters(schema);
    const elements = parameters.properties.elements as Record<string, any>;

    expect(elements.type).toBe('array');
    expect(elements.description).toBe('The shapes to draw');
    // The part that used to be `{ type: 'string' }`.
    expect(elements.items.type).toBe('object');
    expect(elements.items.properties.type).toEqual({
      description: 'Shape',
      type: 'string',
      enum: ['rectangle', 'ellipse'],
    });
    expect(elements.items.properties.x).toEqual({ type: 'number' });
    // Optional inside a nested object is still optional.
    expect(elements.items.required).toEqual(['type', 'x']);
  });

  it('descends into a nested object', () => {
    const schema = z.object({
      style: z.object({
        strokeColor: z.string().describe('CSS colour'),
        opacity: z.number().optional(),
      }),
    });

    const style = zodToToolParameters(schema).properties.style as Record<
      string,
      any
    >;

    expect(style.type).toBe('object');
    expect(style.properties.strokeColor.description).toBe('CSS colour');
    expect(style.required).toEqual(['strokeColor']);
  });

  it('keeps a description that was written before a wrapper', () => {
    /*
     * `z.preprocess(coerce, z.number().describe(...))` puts the description
     * on the inner schema. Reading only the outer one dropped it, so two of
     * the notebook tools shipped an undescribed `index` parameter.
     */
    const schema = z.object({
      index: z.preprocess(
        value => (typeof value === 'string' ? Number(value) : value),
        z.number().int().describe('Cell index (0-based)'),
      ),
    });

    expect(zodToToolParameters(schema).properties.index).toEqual({
      description: 'Cell index (0-based)',
      type: 'number',
    });
  });

  it('reads a union of literals as one enum', () => {
    const schema = z.object({
      align: z.union([z.literal('left'), z.literal('center')]),
    });

    expect(zodToToolParameters(schema).properties.align).toEqual({
      type: 'string',
      enum: ['left', 'center'],
    });
  });

  it('offers a mixed union as alternatives', () => {
    const schema = z.object({
      width: z.union([z.number(), z.literal('inherit')]),
    });

    const width = zodToToolParameters(schema).properties.width as Record<
      string,
      any
    >;
    expect(width.anyOf).toEqual([
      { type: 'number' },
      { type: 'string', enum: ['inherit'] },
    ]);
  });

  it('still flattens an open map to an object, as before', () => {
    // A record's keys are not knowable, so there is nothing truthful to say
    // beyond "an object" — this is the one place flattening is right.
    const schema = z.object({
      metadata: z.record(z.string(), z.unknown()).optional(),
    });

    expect(zodToToolParameters(schema).properties.metadata).toEqual({
      type: 'object',
    });
    expect(zodToToolParameters(schema).required).toEqual([]);
  });

  it('promises nothing about a value the schema left open', () => {
    const schema = z.object({ payload: z.unknown() });

    expect(zodToToolParameters(schema).properties.payload).toEqual({});
  });

  it('stops rather than recursing forever', () => {
    // A schema deep enough to prove the guard fires without hanging the run.
    let deep: z.ZodTypeAny = z.string();
    for (let level = 0; level < 30; level += 1) {
      deep = z.object({ next: deep });
    }

    expect(() =>
      zodToToolParameters(z.object({ root: deep })),
    ).not.toThrow();
  });
});
