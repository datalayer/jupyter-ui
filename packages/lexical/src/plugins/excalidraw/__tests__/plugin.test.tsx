/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Mounting the plugin is what gives a document the drawing tools.
 *
 * Everything else about this feature is machinery underneath that sentence,
 * and the sentence is the part a caller relies on: put `<ExcalidrawPlugin />`
 * in the editor and an agent can draw; leave it out and the tools are not
 * offered, so the model never spends a call discovering that the editor
 * cannot draw.
 *
 * The editor itself is stood in for. What is being checked is the effect that
 * registers and the cleanup that withdraws — not Lexical.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

/** A composer context with just enough editor to satisfy the plugin. */
jest.mock('@lexical/react/LexicalComposerContext', () => ({
  useLexicalComposerContext: () => [
    {
      hasNodes: () => true,
      registerCommand: () => () => {},
    },
  ],
}));

// The modal is a browser-only Excalidraw surface; the plugin never renders it
// unless somebody asks to draw, which nothing here does.
jest.mock('../../../components/ExcalidrawModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../nodes/ExcalidrawNode', () => ({
  ExcalidrawNode: class {},
  $createExcalidrawNode: () => ({ setData: () => {} }),
}));

import { ExcalidrawPlugin } from '../ExcalidrawPlugin';
import { LexicalConfigProvider } from '../../../context/LexicalConfigContext';
import { lexicalStore } from '../../../state/LexicalState';
import { getLexicalTools } from '../../../state/LexicalToolRegistry';

const drawingTools = (id: string) =>
  getLexicalTools(id)
    .definitions.map(definition => definition.toolReferenceName)
    .filter(name => name.startsWith('excalidraw'));

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  lexicalStore.getState().reset();
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});

describe('the tools follow the plugin', () => {
  it('offers nothing before the plugin is mounted', () => {
    expect(drawingTools('doc-1')).toEqual([]);
  });

  it('registers the drawing tools for the document it is in', () => {
    act(() => {
      root.render(
        <LexicalConfigProvider lexicalId="doc-1">
          <ExcalidrawPlugin />
        </LexicalConfigProvider>,
      );
    });

    expect(drawingTools('doc-1')).toContain('excalidrawInsertNode');
    expect(drawingTools('doc-1')).toHaveLength(11);
    // And only for that document.
    expect(drawingTools('doc-2')).toEqual([]);

    act(() => root.unmount());
  });

  it('withdraws them when it unmounts', () => {
    act(() => {
      root.render(
        <LexicalConfigProvider lexicalId="doc-1">
          <ExcalidrawPlugin />
        </LexicalConfigProvider>,
      );
    });
    expect(drawingTools('doc-1')).not.toEqual([]);

    act(() => root.unmount());

    expect(drawingTools('doc-1')).toEqual([]);
  });

  it('mounts without a config provider, and registers nothing', () => {
    /*
     * An editor mounted without an id is not addressable by an agent, so
     * there is nothing to register against. That is a reason to do nothing,
     * not a reason to throw — which is what the throwing `useLexicalConfig`
     * would have done, taking the editor down with it.
     */
    expect(() => {
      act(() => {
        root.render(<ExcalidrawPlugin />);
      });
    }).not.toThrow();

    expect(lexicalStore.getState().pluginTools.size).toBe(0);

    act(() => root.unmount());
  });
});
