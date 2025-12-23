/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import {
  DecoratorNode,
  type EditorConfig,
  type LexicalEditor,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import type { Comment } from '../components/Commenting';

export type SerializedCommentThreadNode = Spread<
  {
    id: string;
    quote: string;
    comments: Comment[];
  },
  SerializedLexicalNode
>;

/**
 * CommentThreadNode stores comment thread data as a Lexical node.
 * This node syncs automatically via the Loro collaboration provider.
 *
 * Unlike the original CommentPlugin which used Yjs for comment storage,
 * this approach stores comments directly in the Lexical editor state,
 * making them part of the document JSON and enabling automatic sync.
 */
export class CommentThreadNode extends DecoratorNode<JSX.Element> {
  __id: string;
  __quote: string;
  __comments: Comment[];

  static getType(): string {
    return 'comment-thread';
  }

  static clone(node: CommentThreadNode): CommentThreadNode {
    return new CommentThreadNode(
      node.__id,
      node.__quote,
      node.__comments,
      node.__key,
    );
  }

  static importJSON(json: SerializedCommentThreadNode): CommentThreadNode {
    return new CommentThreadNode(json.id, json.quote, json.comments);
  }

  exportJSON(): SerializedCommentThreadNode {
    return {
      type: 'comment-thread',
      version: 1,
      id: this.__id,
      quote: this.__quote,
      comments: this.__comments,
    };
  }

  constructor(id: string, quote: string, comments: Comment[], key?: NodeKey) {
    super(key);
    this.__id = id;
    this.__quote = quote;
    this.__comments = comments;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    // Return invisible div - UI is rendered via decorate()
    const div = document.createElement('div');
    div.style.display = 'none';
    return div;
  }

  updateDOM(): boolean {
    // Node is invisible, never needs DOM updates
    return false;
  }

  // Accessors
  getId(): string {
    return this.__id;
  }

  getQuote(): string {
    return this.__quote;
  }

  getComments(): Comment[] {
    return this.__comments;
  }

  // Mutators (create writable copy using getWritable())
  addComment(comment: Comment): void {
    const writable = this.getWritable();
    writable.__comments = [...writable.__comments, comment];
  }

  deleteComment(commentId: string): void {
    const writable = this.getWritable();
    writable.__comments = writable.__comments.map(c =>
      c.id === commentId
        ? { ...c, deleted: true, content: '[Deleted Comment]' }
        : c,
    );
  }

  decorate(_editor: LexicalEditor): JSX.Element {
    // Return empty fragment - UI will be handled by CommentPlugin
    return <></>;
  }
}

export function $createCommentThreadNode(
  id: string,
  quote: string,
  comments: Comment[],
): CommentThreadNode {
  return new CommentThreadNode(id, quote, comments);
}

export function $isCommentThreadNode(node: unknown): node is CommentThreadNode {
  return node instanceof CommentThreadNode;
}
