/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Loom and deck blocks, headless.
 *
 * What a document holding them keeps and gives back: the insert commands
 * answer, the blocks survive a trip through JSON and through HTML, a Loom
 * address is read in all the shapes Loom hands out, and the Loom app id
 * reaches the blocks from the host's configuration. Drawing them — the
 * player, the recorder, Reveal — is the browser's, and not tested here.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import {
  buildEditorFromExtensions,
  getExtensionDependencyFromEditor,
  getPeerDependencyFromEditor,
  type LexicalEditorWithDispose,
} from '@lexical/extension';
import { $generateNodesFromDOM } from '@lexical/html';
import { RichTextExtension } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  $nodesOfType,
  configExtension,
  defineExtension,
  type AnyLexicalExtension,
} from 'lexical';

// As in extensions.test: the notebook stack and the drawing modal are only
// reached when their blocks render, which nothing here does.
jest.mock('../../components/ExcalidrawModal', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));

import { DeckExtension, INSERT_DECK_COMMAND } from '../DeckExtension';
import { JupyterLexicalExtension } from '../JupyterLexicalExtension';
import { INSERT_LOOM_COMMAND, LoomExtension } from '../LoomExtension';
import { $createDeckNode, DeckNode, newDeckSpec } from '../../nodes/DeckNode';
import { $createLoomNode, LoomNode } from '../../nodes/LoomNode';
import {
  LOOM_EXTENSION_NAME,
  loomEmbedUrl,
  loomVideoId,
} from '../../utils/loom';

const ID = 'c2b5b05f548d4f1492d5c107f0c48dbc';
const SHARE = `https://www.loom.com/share/${ID}`;

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
});

const Blocks = defineExtension({
  name: '[test-blocks]',
  dependencies: [
    RichTextExtension,
    configExtension(LoomExtension, { publicAppId: 'an-app-id' }),
    DeckExtension,
  ],
});

/** An editor with an empty paragraph selected, ready for an insert. */
function editorWithCaret(): LexicalEditorWithDispose {
  const editor = build(Blocks);
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      $getRoot().append(paragraph);
      paragraph.select();
    },
    { discrete: true },
  );
  return editor;
}

describe('a Loom address', () => {
  it.each([
    ['a share address', SHARE],
    ['a player address', `https://www.loom.com/embed/${ID}`],
    ['no www', `https://loom.com/share/${ID}`],
    ['a titled share address', `https://www.loom.com/share/Our-demo-${ID}`],
    ['a session query', `${SHARE}?sid=0f6c2b1e`],
    ['surrounding blanks', `  ${SHARE}  `],
  ])('is read from %s', (_, url) => {
    expect(loomVideoId(url)).toBe(ID);
  });

  it.each([
    ['another site', `https://www.youtube.com/share/${ID}`],
    ['a short id', `https://www.loom.com/share/${ID.slice(1)}`],
    ['a Loom page that is not a video', 'https://www.loom.com/pricing'],
    ['no address at all', ''],
  ])('is not read from %s', (_, url) => {
    expect(loomVideoId(url)).toBeNull();
  });
});

describe('the insert commands', () => {
  it('insert an empty Loom block, a Loom video and a deck of one slide', async () => {
    const editor = editorWithCaret();
    expect(editor.dispatchCommand(INSERT_LOOM_COMMAND, undefined)).toBe(true);
    expect(
      editor.dispatchCommand(INSERT_LOOM_COMMAND, {
        url: SHARE,
        title: 'The showcase',
        width: 1920,
        height: 1440,
      }),
    ).toBe(true);
    expect(editor.dispatchCommand(INSERT_DECK_COMMAND, undefined)).toBe(true);
    await settle();

    editor.getEditorState().read(() => {
      const looms = $nodesOfType(LoomNode).map(node => node.getVideo());
      expect(looms).toHaveLength(2);
      expect(looms.map(video => video.url).sort()).toEqual(['', SHARE]);
      const decks = $nodesOfType(DeckNode);
      expect(decks).toHaveLength(1);
      expect(decks[0].getSpec()).toEqual(newDeckSpec());
      expect(decks[0].getSpec().slides).toHaveLength(1);
    });
  });

  it('insert the deck they are given', async () => {
    const editor = editorWithCaret();
    const spec = {
      deck: { title: 'Pitch', template: 'datalayer' },
      slides: [
        { type: 'title' as const, title: 'Pitch' },
        { type: 'statement' as const, statement: 'One idea.' },
      ],
    };
    editor.dispatchCommand(INSERT_DECK_COMMAND, spec);
    await settle();
    editor.getEditorState().read(() => {
      expect($nodesOfType(DeckNode)[0].getSpec()).toEqual(spec);
    });
  });
});

describe('a document holding the blocks', () => {
  it('gives them back from its JSON', () => {
    const spec = newDeckSpec();
    spec.deck.title = 'Kept';
    const editor = build(Blocks);
    editor.update(
      () => {
        $getRoot().append(
          $createLoomNode({
            url: SHARE,
            title: 'The showcase',
            width: 1920,
            height: 1440,
          }),
          $createLoomNode(),
          $createDeckNode(spec),
        );
      },
      { discrete: true },
    );
    const json = JSON.stringify(editor.getEditorState().toJSON());

    const other = build(Blocks);
    other.setEditorState(other.parseEditorState(json));
    other.getEditorState().read(() => {
      expect($nodesOfType(LoomNode).map(node => node.getVideo())).toEqual([
        { url: SHARE, title: 'The showcase', width: 1920, height: 1440 },
        {
          url: '',
          title: undefined,
          width: undefined,
          height: undefined,
        },
      ]);
      expect($nodesOfType(DeckNode)[0].getSpec()).toEqual(spec);
    });
  });

  it('writes them as HTML it can read again', () => {
    const spec = newDeckSpec();
    const editor = build(Blocks);
    let html = '';
    editor.update(
      () => {
        const loom = $createLoomNode({ url: SHARE, title: 'The showcase' });
        const empty = $createLoomNode();
        const deck = $createDeckNode(spec);
        $getRoot().append(loom, empty, deck);

        const player = loom.exportDOM().element as HTMLIFrameElement;
        expect(player.tagName).toBe('IFRAME');
        expect(player.getAttribute('src')).toBe(loomEmbedUrl(ID));
        // Nothing recorded yet: nothing to write.
        expect(empty.exportDOM().element).toBeNull();
        const drawn = deck.exportDOM().element as HTMLElement;
        expect(drawn.textContent).toBe(spec.deck.title);
        html = player.outerHTML + drawn.outerHTML;
      },
      { discrete: true },
    );

    const other = build(Blocks);
    other.update(
      () => {
        const dom = new DOMParser().parseFromString(html, 'text/html');
        $getRoot().clear();
        $getRoot().select();
        $insertNodes($generateNodesFromDOM(other, dom));
      },
      { discrete: true },
    );
    other.getEditorState().read(() => {
      expect($nodesOfType(LoomNode).map(node => node.getVideo().url)).toEqual([
        SHARE,
      ]);
      expect($nodesOfType(DeckNode)[0].getSpec()).toEqual(spec);
    });
  });

  it('takes a Loom player pasted from elsewhere for a Loom block', () => {
    const editor = build(Blocks);
    editor.update(
      () => {
        const dom = new DOMParser().parseFromString(
          `<iframe src="https://www.loom.com/embed/${ID}" title="Pasted"></iframe>`,
          'text/html',
        );
        $getRoot().clear();
        $getRoot().select();
        $insertNodes($generateNodesFromDOM(editor, dom));
      },
      { discrete: true },
    );
    editor.getEditorState().read(() => {
      expect($nodesOfType(LoomNode).map(node => node.getVideo())).toEqual([
        { url: SHARE, title: 'Pasted', width: undefined, height: undefined },
      ]);
    });
  });
});

describe('the Loom app id', () => {
  it('reaches the blocks from the host configuration, by name', () => {
    const editor = build(Blocks);
    expect(
      getExtensionDependencyFromEditor(editor, LoomExtension).config
        .publicAppId,
    ).toBe('an-app-id');
    // How a block reads it: by name, without importing the extension.
    expect(
      getPeerDependencyFromEditor<typeof LoomExtension>(
        editor,
        LOOM_EXTENSION_NAME,
      )?.config.publicAppId,
    ).toBe('an-app-id');
  });

  it('is absent unless the host gives one', () => {
    const editor = build(
      defineExtension({
        name: '[test-no-id]',
        dependencies: [RichTextExtension, LoomExtension],
      }),
    );
    expect(
      getExtensionDependencyFromEditor(editor, LoomExtension).config
        .publicAppId,
    ).toBeUndefined();
  });
});

/** The node types an extension brings, with everything it depends on. */
function nodeTypesOf(extension: AnyLexicalExtension): Set<string> {
  const seen = new Set<string>();
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

describe('the bundled document', () => {
  // Walked rather than built: building the bundle needs a React host for
  // its plug-ins, and which nodes it brings does not.
  it('has the video, Loom and deck blocks', () => {
    const types = nodeTypesOf(JupyterLexicalExtension);
    expect(types.has(LoomNode.getType())).toBe(true);
    expect(types.has(DeckNode.getType())).toBe(true);
    expect(types.has('video')).toBe(true);
  });
});
