/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Tools that come and go with the plugin.
 *
 * The point of registering from inside `ExcalidrawPlugin` is that an agent's
 * tool list follows the editor's actual composition: an editor that never
 * mounted the plugin does not offer drawing tools, and one that did stops
 * offering them when it unmounts. What is checked here is the machinery under
 * that — the store slice the plugin writes to, the merge that produces a
 * document's tool list, and the executor lookup that gets a call to the
 * plugin's own code instead of to a store method that does not exist.
 */

import { beforeEach, describe, expect, it } from '@jest/globals';

import { lexicalStore } from '../../../state/LexicalState';
import { getLexicalTools } from '../../../state/LexicalToolRegistry';
import { DefaultExecutor } from '../../../tools/core/executor';
import { lexicalToolDefinitions } from '../../../tools';
import { excalidrawPluginTools } from '../tools';

const DOC = 'doc-1';

const names = (id: string) =>
  getLexicalTools(id).definitions.map(
    definition => definition.toolReferenceName,
  );

beforeEach(() => {
  lexicalStore.getState().reset();
});

describe('a document offers what its plugins brought', () => {
  it('offers only the block tools when nothing is mounted', () => {
    expect(names(DOC)).toEqual(
      lexicalToolDefinitions.map(definition => definition.toolReferenceName),
    );
    expect(names(DOC)).not.toContain('excalidrawInsertNode');
  });

  it('offers the drawing tools once the plugin registers', () => {
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);

    const offered = names(DOC);
    expect(offered).toContain('excalidrawInsertNode');
    expect(offered).toContain('excalidrawConnectElements');
    // The block tools are still all there.
    expect(offered).toEqual(
      expect.arrayContaining(
        lexicalToolDefinitions.map(d => d.toolReferenceName),
      ),
    );
    expect(getLexicalTools(DOC).operations.excalidrawAddElements).toBeDefined();
  });

  it('takes them away again when the plugin unmounts', () => {
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    lexicalStore.getState().unregisterPluginTools(DOC, 'excalidraw');

    expect(names(DOC)).not.toContain('excalidrawInsertNode');
  });

  it("keeps one document's plugins out of another's", () => {
    // Two editors on one page are composed independently.
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);

    expect(names('doc-2')).not.toContain('excalidrawInsertNode');
  });

  it('registers a plugin once however often it mounts', () => {
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);

    const drawing = names(DOC).filter(name => name.startsWith('excalidraw'));
    expect(drawing).toHaveLength(excalidrawPluginTools.definitions.length);
  });
});

describe('the key a subscriber watches', () => {
  it('changes when a plugin arrives or leaves, and not otherwise', () => {
    const key = () => lexicalStore.getState().selectPluginToolsKey(DOC);

    expect(key()).toBe('');
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    expect(key()).toBe('excalidraw');

    // Re-registering the same plugin is not a change to the set.
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    expect(key()).toBe('excalidraw');

    lexicalStore.getState().unregisterPluginTools(DOC, 'excalidraw');
    expect(key()).toBe('');
  });

  it('ignores an unregister for a plugin that was never there', () => {
    const before = lexicalStore.getState().pluginTools;
    lexicalStore.getState().unregisterPluginTools(DOC, 'excalidraw');

    // Identical object: a no-op must not wake every subscriber.
    expect(lexicalStore.getState().pluginTools).toBe(before);
  });
});

describe("the executor finds the plugin's own code", () => {
  const adapter = { marker: 'the adapter' } as any;

  beforeEach(() => {
    const lexicals = new Map(lexicalStore.getState().lexicals);
    lexicals.set(DOC, { adapter });
    lexicalStore.getState().setLexicals(lexicals);
  });

  it('routes a plugin operation to its handler, with the adapter', async () => {
    const seen: unknown[] = [];
    lexicalStore.getState().registerPluginTools(DOC, {
      name: 'test',
      definitions: [],
      operations: {},
      handlers: {
        testOperation: async (given, args) => {
          seen.push({ given, args });
          return { ok: true };
        },
      },
    });

    const executor = new DefaultExecutor(DOC, lexicalStore.getState());
    const result = await executor.execute('testOperation', { blockId: '7' });

    expect(result).toEqual({ ok: true });
    // The handler gets the adapter for the document, and the call's own
    // arguments — not the document id the executor used to find it.
    expect(seen).toEqual([{ given: adapter, args: { blockId: '7' } }]);
  });

  it('falls through to the store for a core operation', async () => {
    // `insertBlock` is a store method, and a plugin registering handlers must
    // not shadow it.
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    const executor = new DefaultExecutor(DOC, lexicalStore.getState());

    await expect(executor.execute('thisIsNotAnOperation', {})).rejects.toThrow(
      /not found or not a function/,
    );
  });

  it('says the document is missing rather than calling a handler without one', async () => {
    lexicalStore.getState().setLexicals(new Map());
    lexicalStore.getState().registerPluginTools(DOC, excalidrawPluginTools);
    const executor = new DefaultExecutor(DOC, lexicalStore.getState());

    await expect(
      executor.execute('excalidrawReadScene', { blockId: '1' }),
    ).rejects.toThrow(/needs an editor to act on/);
  });
});
