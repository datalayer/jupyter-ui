/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A Loom video in the document.
 *
 * Inserted empty, a Loom block offers to record a video — the author signs
 * in to their Loom account, where the video is saved — or to take the
 * address of one already made, and from then on shows it. What it keeps is
 * the share address, with the title and the recording's size when Loom
 * said: the player is always Loom's own, built from the address.
 *
 * @module nodes/LoomNode
 */

import type { JSX } from 'react';
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
import LoomComponent from '../components/LoomComponent';
import {
  loomEmbedUrl,
  loomShareUrl,
  loomVideoId,
  type LoomVideoData,
} from '../utils/loom';

export type SerializedLoomNode = Spread<
  {
    /** The share address; empty while the block waits for a video. */
    url: string;
    title?: string;
    width?: number;
    height?: number;
    type: 'loom';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

function $convertLoomElement(domNode: HTMLElement): DOMConversionOutput | null {
  const kept = domNode.getAttribute('data-lexical-loom');
  const id = loomVideoId(kept || domNode.getAttribute('src') || '');
  if (!id) {
    return null;
  }
  return {
    node: $createLoomNode({
      url: loomShareUrl(id),
      title: domNode.getAttribute('title') || undefined,
    }),
  };
}

export class LoomNode extends DecoratorBlockNode {
  __url: string;
  __title: string | undefined;
  __width: number | undefined;
  __height: number | undefined;

  static getType(): string {
    return 'loom';
  }

  static clone(node: LoomNode): LoomNode {
    return new LoomNode(
      {
        url: node.__url,
        title: node.__title,
        width: node.__width,
        height: node.__height,
      },
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedLoomNode): LoomNode {
    const node = $createLoomNode({
      url: serialized.url,
      title: serialized.title,
      width: serialized.width,
      height: serialized.height,
    });
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedLoomNode {
    return {
      ...super.exportJSON(),
      type: 'loom',
      version: 1,
      url: this.__url,
      ...(this.__title ? { title: this.__title } : {}),
      ...(this.__width ? { width: this.__width } : {}),
      ...(this.__height ? { height: this.__height } : {}),
    };
  }

  /** A Loom player, pasted or saved as HTML, comes back as a Loom block. */
  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-lexical-loom') ||
        loomVideoId(domNode.getAttribute('src') || '')
          ? { conversion: $convertLoomElement, priority: 1 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const id = loomVideoId(this.__url);
    if (!id) {
      // Nothing recorded yet: nothing to show outside the editor.
      return { element: null };
    }
    const element = document.createElement('iframe');
    element.setAttribute('data-lexical-loom', this.__url);
    element.setAttribute('src', loomEmbedUrl(id));
    element.setAttribute('title', this.__title || 'Loom video');
    element.setAttribute('width', String(this.__width || 640));
    element.setAttribute('height', String(this.__height || 360));
    element.setAttribute('frameborder', '0');
    element.setAttribute('allowfullscreen', 'true');
    return { element };
  }

  constructor(
    video: LoomVideoData = { url: '' },
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__url = video.url;
    this.__title = video.title;
    this.__width = video.width;
    this.__height = video.height;
  }

  getVideo(): LoomVideoData {
    const self = this.getLatest();
    return {
      url: self.__url,
      title: self.__title,
      width: self.__width,
      height: self.__height,
    };
  }

  /** Show `video` — the one just recorded, or the one whose address was given. */
  setVideo(video: LoomVideoData): void {
    const writable = this.getWritable();
    writable.__url = video.url;
    writable.__title = video.title;
    writable.__width = video.width;
    writable.__height = video.height;
  }

  getTextContent(): string {
    return this.__url;
  }

  updateDOM(): false {
    return false;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    return (
      <LoomComponent
        className={{
          base: embedBlockTheme.base || '',
          focus: embedBlockTheme.focus || '',
        }}
        format={this.__format}
        nodeKey={this.getKey()}
        video={{
          url: this.__url,
          title: this.__title,
          width: this.__width,
          height: this.__height,
        }}
      />
    );
  }

  isTopLevel(): true {
    return true;
  }
}

/** A Loom block: showing `video`, or waiting for one when none is given. */
export function $createLoomNode(video?: LoomVideoData): LoomNode {
  return new LoomNode(video);
}

export function $isLoomNode(
  node: LexicalNode | null | undefined,
): node is LoomNode {
  return node instanceof LoomNode;
}
