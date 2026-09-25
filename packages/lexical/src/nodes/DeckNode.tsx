/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A deck in the document: slides described as data and drawn by
 * `@datalayer/decks`.
 *
 * The block keeps the deck's specification — a `DeckSpec`, the same JSON a
 * deck in the Datalayer library is — and draws it in a 16:9 frame. A new
 * block holds one title slide; double-clicking it opens the specification
 * for editing, checked with `validateDeckSpec` before it is kept.
 *
 * The renderer (Reveal.js, Mermaid and the slide library) is fetched when a
 * deck is first drawn, not with the editor: an editor that never shows a
 * deck never downloads one.
 *
 * @module nodes/DeckNode
 */

import type { JSX } from 'react';
import type { DeckSpec } from '@datalayer/decks';
import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { Suspense, lazy } from 'react';

const DeckComponent = lazy(() => import('../components/DeckComponent'));

/** A deck of one slide, for a block just inserted. */
export function newDeckSpec(): DeckSpec {
  return {
    deck: { title: 'Untitled deck', template: 'datalayer' },
    slides: [
      {
        type: 'title',
        title: 'A new slide',
        meta: 'Double-click to edit its specification',
      },
    ],
  };
}

export type SerializedDeckNode = Spread<
  {
    spec: DeckSpec;
    type: 'deck';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

function $convertDeckElement(domNode: HTMLElement): DOMConversionOutput | null {
  const kept = domNode.getAttribute('data-lexical-deck');
  if (!kept) {
    return null;
  }
  try {
    return { node: $createDeckNode(JSON.parse(kept) as DeckSpec) };
  } catch {
    return null;
  }
}

export class DeckNode extends DecoratorBlockNode {
  __spec: DeckSpec;

  static getType(): string {
    return 'deck';
  }

  static clone(node: DeckNode): DeckNode {
    return new DeckNode(node.__spec, node.__format, node.__key);
  }

  static importJSON(serialized: SerializedDeckNode): DeckNode {
    const node = $createDeckNode(serialized.spec);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedDeckNode {
    return {
      ...super.exportJSON(),
      type: 'deck',
      version: 1,
      spec: this.__spec,
    };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-lexical-deck')
          ? { conversion: $convertDeckElement, priority: 2 }
          : null,
    };
  }

  /**
   * Outside the editor a deck is its title, with the specification kept on
   * the element so that pasting it back gives the deck again.
   */
  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-lexical-deck', JSON.stringify(this.__spec));
    const title = document.createElement('p');
    title.textContent = this.__spec.deck?.title || 'Deck';
    element.appendChild(title);
    return { element };
  }

  constructor(spec?: DeckSpec, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__spec = spec ?? newDeckSpec();
  }

  getSpec(): DeckSpec {
    return this.getLatest().__spec;
  }

  setSpec(spec: DeckSpec): void {
    this.getWritable().__spec = spec;
  }

  getTextContent(): string {
    return this.__spec.deck?.title || '';
  }

  updateDOM(): false {
    return false;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    return (
      <Suspense fallback={null}>
        <DeckComponent
          className={{
            base: embedBlockTheme.base || '',
            focus: embedBlockTheme.focus || '',
          }}
          format={this.__format}
          nodeKey={this.getKey()}
          spec={this.__spec}
        />
      </Suspense>
    );
  }

  isTopLevel(): true {
    return true;
  }
}

/** A deck block, drawing `spec` — one title slide when none is given. */
export function $createDeckNode(spec?: DeckSpec): DeckNode {
  return new DeckNode(spec);
}

export function $isDeckNode(
  node: LexicalNode | null | undefined,
): node is DeckNode {
  return node instanceof DeckNode;
}
