/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Excalidraw tools as an agent meets them.
 *
 * A tool has three halves that have to agree — what is advertised, what
 * validates the call, what runs it — and a disagreement between them does not
 * show up until an agent tries the tool, in a session, in front of somebody.
 * The build's `validate-tools-sync` catches this for the core tools by
 * reading their filenames; a plugin's tools do not have one file each, so the
 * same check is made here instead.
 *
 * The second thing checked is the schema an agent actually receives. These
 * tools take lists of shapes, and a converter that flattened those to
 * `string` would leave the model guessing at every field — so the shape of
 * the generated JSON Schema is asserted, not just its existence.
 */

import { describe, expect, it } from '@jest/globals';

import { excalidrawToolDefinitions } from '../definitions';
import { excalidrawToolOperations } from '../operations';
import { excalidrawPluginTools, excalidrawToolMismatches } from '../tools';

describe('the three halves agree', () => {
  it('has no definition, operation or handler on its own', () => {
    // Reported rather than counted, so a failure names what drifted.
    expect(excalidrawToolMismatches()).toEqual([]);
  });

  it('offers eleven tools, all of them named for the plugin', () => {
    expect(excalidrawToolDefinitions).toHaveLength(11);
    for (const definition of excalidrawToolDefinitions) {
      expect(definition.toolReferenceName).toMatch(/^excalidraw[A-Z]/);
      expect(definition.name).toBe(`datalayer_${definition.toolReferenceName}`);
      expect(definition.operation).toBe(definition.toolReferenceName);
    }
  });

  it('bundles what the plugin registers under one name', () => {
    expect(excalidrawPluginTools.name).toBe('excalidraw');
    expect(excalidrawPluginTools.definitions).toBe(excalidrawToolDefinitions);
    expect(Object.keys(excalidrawPluginTools.handlers).sort()).toEqual(
      Object.keys(excalidrawPluginTools.operations).sort(),
    );
  });

  it('says what each tool does, at a length worth reading', () => {
    for (const definition of excalidrawToolDefinitions) {
      // The description is the whole of what the model knows about the tool.
      expect(definition.description.length).toBeGreaterThan(80);
      expect(definition.displayName).toBeTruthy();
    }
  });

  it('asks before it destroys, and not before it reads', () => {
    const confirms = (name: string) =>
      excalidrawToolDefinitions.find(d => d.toolReferenceName === name)?.config
        ?.requiresConfirmation;

    expect(confirms('excalidrawDeleteElements')).toBe(true);
    expect(confirms('excalidrawClearScene')).toBe(true);
    expect(confirms('excalidrawReadScene')).toBe(false);
    expect(confirms('excalidrawListDrawings')).toBe(false);
  });
});

describe('what the model is told the parameters are', () => {
  const parametersOf = (name: string) =>
    excalidrawToolDefinitions.find(d => d.toolReferenceName === name)!
      .parameters as any;

  it('describes a shape field by field, not as a string', () => {
    /*
     * The reason the converter in jupyter-react had to learn to recurse. A
     * model told `elements: string[]` cannot draw anything; a model told the
     * element's own properties can.
     */
    const elements = parametersOf('excalidrawInsertNode').properties.elements;

    expect(elements.type).toBe('array');
    expect(elements.items.type).toBe('object');
    expect(elements.items.properties.type.enum).toContain('rectangle');
    expect(elements.items.properties.type.enum).toContain('arrow');
    expect(elements.items.properties.x.type).toBe('number');
    expect(elements.items.properties.label.description).toMatch(/inside/i);
    // Position is the only thing a shape cannot be given a default for.
    expect(elements.items.required.sort()).toEqual(['type', 'x', 'y']);
  });

  it('describes an update the same way', () => {
    const updates = parametersOf('excalidrawUpdateElements').properties.updates;

    expect(updates.items.type).toBe('object');
    expect(updates.items.required).toEqual(['id']);
    expect(updates.items.properties.strokeColor.type).toBe('string');
  });

  it('requires the drawing to be named, everywhere it has to be', () => {
    for (const name of [
      'excalidrawReadScene',
      'excalidrawAddElements',
      'excalidrawUpdateElements',
      'excalidrawDeleteElements',
      'excalidrawConnectElements',
      'excalidrawSetAppState',
      'excalidrawResize',
      'excalidrawClearScene',
    ]) {
      expect(parametersOf(name).required).toContain('blockId');
    }
    // The two that make a drawing cannot be given one.
    expect(parametersOf('excalidrawInsertNode').required).not.toContain(
      'blockId',
    );
    expect(parametersOf('excalidrawFromMermaid').required).not.toContain(
      'blockId',
    );
  });

  it('asks for nothing at all to list the drawings', () => {
    expect(parametersOf('excalidrawListDrawings')).toEqual({
      type: 'object',
      properties: {},
      required: [],
    });
  });
});

describe('an operation refuses a call it cannot make', () => {
  const context = { documentId: '', executor: undefined } as any;

  it('says so when there is no document', async () => {
    await expect(
      excalidrawToolOperations.excalidrawListDrawings.execute({}, context),
    ).rejects.toThrow(/Document ID is required/);
  });

  it('says so when there is no executor', async () => {
    await expect(
      excalidrawToolOperations.excalidrawListDrawings.execute({}, {
        documentId: 'doc',
      } as any),
    ).rejects.toThrow(/Executor is required/);
  });

  it('rejects parameters the tool cannot act on', async () => {
    await expect(
      excalidrawToolOperations.excalidrawReadScene.execute({}, {
        documentId: 'doc',
        executor: { execute: async () => ({}) },
      } as any),
    ).rejects.toThrow(/blockId/);
  });

  it('passes the validated call straight through to the executor', async () => {
    const calls: Array<{ name: string; args: unknown }> = [];
    const result = await excalidrawToolOperations.excalidrawReadScene.execute(
      { blockId: '7', detail: 'summary' },
      {
        documentId: 'doc',
        executor: {
          execute: async (name: string, args: unknown) => {
            calls.push({ name, args });
            return { blockId: '7', elementCount: 0 };
          },
        },
      } as any,
    );

    expect(calls).toEqual([
      {
        name: 'excalidrawReadScene',
        args: { blockId: '7', detail: 'summary' },
      },
    ]);
    expect(result).toEqual({ blockId: '7', elementCount: 0 });
  });
});
