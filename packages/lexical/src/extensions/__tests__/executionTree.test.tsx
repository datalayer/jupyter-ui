/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The execution tree node (PLAN_ORCHESTRATOR.md, O1-15).
 *
 * It is a block on the root, it keeps the execution it is about through a
 * save and a load and nothing else, the insert command puts it at the root,
 * and it draws whatever the host renders for that execution — or, with no
 * host renderer, says which execution it is about.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { describe, expect, it } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { buildEditorFromExtensions } from '@lexical/extension';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { $getRoot, defineExtension } from 'lexical';

import { OrchestrationRenderersContext } from '../../context/OrchestrationRenderersContext';
import {
  $createExecutionTreeNode,
  $isExecutionTreeNode,
  ExecutionTreeNode,
} from '../../nodes/ExecutionTreeNode';
import {
  ExecutionTreeExtension,
  INSERT_EXECUTION_TREE_COMMAND,
} from '../ExecutionTreeExtension';

const document_ = (seed?: string) =>
  defineExtension({
    name: '[root]',
    dependencies: [RichTextExtension, ExecutionTreeExtension],
    ...(seed
      ? {
          $initialEditorState: () => {
            $getRoot().append($createExecutionTreeNode(seed));
          },
        }
      : {}),
  });

describe('the execution tree node', () => {
  it('is registered, and put at the root by its command, as a block', () => {
    const editor = buildEditorFromExtensions(document_());
    expect(editor.hasNodes([ExecutionTreeNode])).toBe(true);

    editor.dispatchCommand(INSERT_EXECUTION_TREE_COMMAND, 'exec_1');

    editor.read(() => {
      const trees = $getRoot().getChildren().filter($isExecutionTreeNode);
      expect(trees.map(node => node.getExecutionId())).toEqual(['exec_1']);
      expect(trees[0].isInline()).toBe(false);
    });
    editor.dispose();
  });

  it('keeps the execution it is about, and nothing else, through a save and a load', () => {
    const editor = buildEditorFromExtensions(document_('exec_2'));
    // The seeded state is an update like any other: reading commits it.
    editor.read(() => undefined);
    const saved = editor.getEditorState().toJSON();
    const [serialized] = saved.root.children as unknown as Array<
      Record<string, unknown>
    >;
    expect(serialized).toEqual(
      expect.objectContaining({
        type: 'execution-tree',
        version: 1,
        executionId: 'exec_2',
      }),
    );

    const other = buildEditorFromExtensions(document_());
    other.setEditorState(other.parseEditorState(saved));
    other.read(() => {
      const node = $getRoot().getFirstChild();
      expect($isExecutionTreeNode(node) && node.getExecutionId()).toBe(
        'exec_2',
      );
    });
    editor.dispose();
    other.dispose();
  });

  it('keeps the format and the marks a document put on it', () => {
    const editor = buildEditorFromExtensions(document_());
    const state = {
      root: {
        children: [
          {
            type: 'execution-tree',
            version: 1,
            format: 'center',
            executionId: 'exec_5',
            $: { note: 'kept' },
          },
        ],
        direction: null,
        format: '',
        indent: 0,
        type: 'root',
        version: 1,
      },
    };
    editor.setEditorState(editor.parseEditorState(JSON.stringify(state)));
    editor.read(() => undefined);
    const [saved] = editor.getEditorState().toJSON().root
      .children as unknown as Array<Record<string, unknown>>;
    expect(saved).toEqual(
      expect.objectContaining({
        executionId: 'exec_5',
        format: 'center',
        $: { note: 'kept' },
      }),
    );
    editor.dispose();
  });

  it('draws what the host renders for the execution', async () => {
    const container = window.document.createElement('div');
    window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <OrchestrationRenderersContext.Provider
          value={{
            renderExecutionTree: ({ executionId }) => (
              <span data-rendered>{`tree of ${executionId}`}</span>
            ),
          }}
        >
          <LexicalExtensionComposer
            extension={document_('exec_3')}
            contentEditable={null}
          >
            <ContentEditable />
          </LexicalExtensionComposer>
        </OrchestrationRenderersContext.Provider>,
      );
    });

    expect(container.querySelector('[data-rendered]')?.textContent).toBe(
      'tree of exec_3',
    );
    await act(async () => root.unmount());
    container.remove();
  });

  it('says which execution it is about when the host renders nothing', async () => {
    const container = window.document.createElement('div');
    window.document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <LexicalExtensionComposer
          extension={document_('exec_4')}
          contentEditable={null}
        >
          <ContentEditable />
        </LexicalExtensionComposer>,
      );
    });

    expect(
      container.querySelector('[data-execution-tree="exec_4"]')?.textContent,
    ).toBe('Execution exec_4');
    await act(async () => root.unmount());
    container.remove();
  });
});
