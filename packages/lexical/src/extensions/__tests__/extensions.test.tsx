/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What an editor built from this package's extensions can do.
 *
 * The extensions carry the nodes and the commands the plug-ins used to bring,
 * so a host that builds its editor with `buildEditorFromExtensions` gets the
 * same document as one that mounts the plug-ins — with no React in the way.
 * These tests build that editor headlessly (no root element, no React) and
 * check that the document is there: the nodes are registered, the insert
 * commands answer, configuration reaches the behaviour and can be changed on
 * the live editor through its signals, and the store registration follows
 * the editor's life. The last test hosts a React extension in the composer
 * and checks its plug-in mounts where the document id is.
 */

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  buildEditorFromExtensions,
  getExtensionDependencyFromEditor,
  type LexicalEditorWithDispose,
} from '@lexical/extension';
import { CodeExtension, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkExtension } from '@lexical/link';
import {
  $createListItemNode,
  $createListNode,
  CheckListExtension,
  ListExtension,
  ListNode,
} from '@lexical/list';
import { MarkNode } from '@lexical/mark';
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { RichTextExtension } from '@lexical/rich-text';
import { TableExtension as LexicalTableExtension } from '@lexical/table';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $nodesOfType,
  configExtension,
  defineExtension,
  INDENT_CONTENT_COMMAND,
  type AnyLexicalExtension,
} from 'lexical';

// The drawing modal is a browser-only Excalidraw surface; nothing here opens it.
jest.mock('../../components/ExcalidrawModal', () => ({
  __esModule: true,
  default: () => null,
}));
// The notebook stack behind the Jupyter nodes and plug-ins is only reached
// when they render, which nothing here does; importing it would drag a
// service worker into Node.
jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { AutoLinkExtension } from '../AutoLinkExtension';
import { CodeBlockHighlightExtension } from '../CodeBlockHighlightExtension';
import {
  CollapsibleExtension,
  INSERT_COLLAPSIBLE_COMMAND,
} from '../CollapsibleExtension';
import { CommentExtension } from '../CommentExtension';
import {
  EquationsExtension,
  INSERT_EQUATION_COMMAND,
} from '../EquationsExtension';
import { ExcalidrawExtension } from '../ExcalidrawExtension';
import { HorizontalRuleExtension } from '../HorizontalRuleExtension';
import { ImagesExtension } from '../ImagesExtension';
import { JupyterLexicalExtension } from '../JupyterLexicalExtension';
import { LexicalStateExtension } from '../LexicalStateExtension';
import { ListMaxIndentLevelExtension } from '../ListMaxIndentLevelExtension';
import { MarkdownShortcutsExtension } from '../MarkdownShortcutsExtension';
import { INSERT_YOUTUBE_COMMAND, YouTubeExtension } from '../YouTubeExtension';
import { CommentThreadNode } from '../../nodes/CommentThreadNode';
import { EquationNode } from '../../nodes/EquationNode';
import { ImageNode } from '../../nodes/ImageNode';
import { YouTubeNode } from '../../nodes/YouTubeNode';
import {
  CollapsibleContainerNode,
  CollapsibleContentNode,
  CollapsibleTitleNode,
} from '../../plugins/CollapsiblePlugin';
import { LexicalConfigProvider } from '../../context/LexicalConfigContext';
import { lexicalStore } from '../../state/LexicalState';
import { getLexicalTools } from '../../state/LexicalToolRegistry';

const editors: LexicalEditorWithDispose[] = [];

function build(extension: AnyLexicalExtension): LexicalEditorWithDispose {
  const editor = buildEditorFromExtensions(extension);
  editors.push(editor);
  return editor;
}

/** Let the updates a command queued commit. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

afterEach(() => {
  while (editors.length > 0) {
    editors.pop()!.dispose();
  }
  lexicalStore.getState().reset();
});

/** The document the plug-in tree of the old editor used to assemble. */
const DocumentExtension = defineExtension({
  name: '[test-document]',
  dependencies: [
    RichTextExtension,
    ListExtension,
    CheckListExtension,
    LinkExtension,
    // Bare tables, as the bundle's TableExtension configures them.
    configExtension(LexicalTableExtension, { hasHorizontalScroll: false }),
    CodeExtension,
    AutoLinkExtension,
    HorizontalRuleExtension,
    YouTubeExtension,
    EquationsExtension,
    ImagesExtension,
    CollapsibleExtension,
    CodeBlockHighlightExtension,
    ListMaxIndentLevelExtension,
    MarkdownShortcutsExtension,
    CommentExtension,
  ],
});

describe('a headless editor built from the extensions', () => {
  it('registers the nodes the plug-ins used to require', () => {
    const editor = build(DocumentExtension);
    expect(
      editor.hasNodes([
        HorizontalRuleNode,
        YouTubeNode,
        EquationNode,
        ImageNode,
        CollapsibleContainerNode,
        CollapsibleTitleNode,
        CollapsibleContentNode,
        CodeNode,
        ListNode,
        AutoLinkNode,
        MarkNode,
        CommentThreadNode,
      ]),
    ).toBe(true);
  });

  it('answers the insert commands', async () => {
    const editor = build(DocumentExtension);
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.select();
      },
      { discrete: true },
    );

    expect(editor.dispatchCommand(INSERT_YOUTUBE_COMMAND, 'dQw4w9WgXcQ')).toBe(
      true,
    );
    expect(
      editor.dispatchCommand(INSERT_EQUATION_COMMAND, {
        equation: 'x^2',
        inline: true,
      }),
    ).toBe(true);
    expect(editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)).toBe(
      true,
    );
    await settle();

    editor.getEditorState().read(() => {
      expect($nodesOfType(YouTubeNode)).toHaveLength(1);
      expect($nodesOfType(EquationNode)).toHaveLength(1);
      expect($nodesOfType(CollapsibleContainerNode)).toHaveLength(1);
    });
  });
});

describe('the list ceiling', () => {
  const nestedLists = (editor: LexicalEditorWithDispose) =>
    editor.getEditorState().read(() => $nodesOfType(ListNode).length);

  it('comes from the configuration and can be raised on the live editor', async () => {
    const editor = build(
      defineExtension({
        name: '[shallow-lists]',
        dependencies: [
          RichTextExtension,
          configExtension(ListMaxIndentLevelExtension, { maxDepth: 1 }),
        ],
      }),
    );
    const { config, output } = getExtensionDependencyFromEditor(
      editor,
      ListMaxIndentLevelExtension,
    );
    expect(config.maxDepth).toBe(1);
    expect(output.maxDepth.value).toBe(1);

    editor.update(
      () => {
        const item = $createListItemNode().append($createTextNode('one'));
        $getRoot().append($createListNode('bullet').append(item));
        item.selectEnd();
      },
      { discrete: true },
    );

    // Under a ceiling of one, the only item may not be indented.
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    await settle();
    expect(nestedLists(editor)).toBe(1);

    // Raise the ceiling through the signal: the same indent now nests it.
    output.maxDepth.value = 7;
    editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
    await settle();
    expect(nestedLists(editor)).toBe(2);
  });
});

describe('the editor in the store', () => {
  it('is registered under its id, follows the id, and leaves on dispose', () => {
    const editor = build(
      defineExtension({
        name: '[stateful]',
        dependencies: [
          configExtension(LexicalStateExtension, { lexicalId: 'doc-1' }),
        ],
      }),
    );
    const lexicals = () => lexicalStore.getState().lexicals;
    expect(lexicals().get('doc-1')?.adapter?.editor).toBe(editor);

    const { lexicalId } = getExtensionDependencyFromEditor(
      editor,
      LexicalStateExtension,
    ).output;
    lexicalId.value = 'doc-2';
    expect(lexicals().has('doc-1')).toBe(false);
    expect(lexicals().get('doc-2')?.adapter?.editor).toBe(editor);

    editors.pop()!.dispose();
    expect(lexicals().size).toBe(0);
  });

  it('is not registered without an id', () => {
    build(
      defineExtension({
        name: '[anonymous]',
        dependencies: [LexicalStateExtension],
      }),
    );
    expect(lexicalStore.getState().lexicals.size).toBe(0);
  });
});

/** The node types of an extension and everything it depends on. */
function nodeTypesOf(extension: AnyLexicalExtension, seen = new Set<string>()) {
  const types = new Set<string>();
  const visit = (candidate: unknown) => {
    const ext = (
      Array.isArray(candidate) ? candidate[0] : candidate
    ) as AnyLexicalExtension;
    if (seen.has(ext.name)) {
      return;
    }
    seen.add(ext.name);
    const nodes = typeof ext.nodes === 'function' ? ext.nodes() : ext.nodes;
    for (const node of nodes ?? []) {
      if (typeof node === 'function') {
        types.add(node.getType());
      }
    }
    for (const dep of ext.dependencies ?? []) {
      visit(dep);
    }
  };
  visit(extension);
  return types;
}

describe('the bundle', () => {
  it('carries every node the LexicalComposer editor used to list', () => {
    const types = nodeTypesOf(JupyterLexicalExtension);
    const expected = [
      'autolink',
      'code',
      'code-highlight',
      'collapsible-container',
      'collapsible-content',
      'collapsible-title',
      CommentThreadNode.getType(),
      'counter',
      'equation',
      'excalidraw',
      'hashtag',
      'heading',
      'horizontalrule',
      'image',
      'jupyter-input-highlight',
      'jupyter-input',
      'jupyter-output',
      'link',
      'listitem',
      'list',
      'mark',
      'quote',
      'tablecell',
      'table',
      'tablerow',
      'youtube',
    ];
    const missing = expected.filter(type => !types.has(type));
    expect(missing).toEqual([]);
  });
});

describe('a React extension in the composer', () => {
  const drawingTools = (id: string) =>
    getLexicalTools(id)
      .definitions.map(definition => definition.toolReferenceName)
      .filter(name => name.startsWith('excalidraw'));

  it('mounts its plug-in inside the composer, where the document id is', () => {
    const extension = defineExtension({
      name: '[drawing]',
      dependencies: [RichTextExtension, ExcalidrawExtension],
    });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);

    act(() => {
      root.render(
        <LexicalConfigProvider lexicalId="doc-draw">
          <LexicalExtensionComposer
            extension={extension}
            contentEditable={null}
          />
        </LexicalConfigProvider>,
      );
    });
    expect(drawingTools('doc-draw').length).toBeGreaterThan(0);

    act(() => {
      root.unmount();
    });
    expect(drawingTools('doc-draw')).toEqual([]);
    host.remove();
  });
});
