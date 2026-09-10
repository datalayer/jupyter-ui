/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useState } from 'react';
import type { LexicalEditor } from 'lexical';
import { $getRoot } from 'lexical';
import {
  $createCommentThreadNode,
  $isCommentThreadNode,
  type CommentThreadNode,
} from '../nodes/CommentThreadNode';

/** Somebody a comment names: its author, a thread's assignee, a mention. */
export type CommentPerson = {
  uid: string;
  handle?: string | null;
  name?: string | null;
};

export type Comment = {
  author: string;
  content: string;
  deleted: boolean;
  id: string;
  /** The uids of the people the comment mentions. */
  mentions?: Array<string>;
  timeStamp: number;
  type: 'comment';
};

export type Thread = {
  /** Whom the thread is assigned to, when its store assigns threads. */
  assignee?: CommentPerson | null;
  comments: Array<Comment>;
  id: string;
  quote: string;
  type: 'thread';
};

export type Comments = Array<Thread | Comment>;

/**
 * What `CommentPlugin` reads its threads from and writes them to.
 *
 * `CommentStore` keeps the threads in the document, as nodes, which is all a
 * local file has; `ApiCommentStore` keeps them in a service, which also knows
 * who may be mentioned or assigned.
 */
export interface ICommentStore {
  getComments(): Comments;
  /** Open a thread, or add a comment to the thread given. */
  addComment(commentOrThread: Comment | Thread, thread?: Thread): void;
  /** Delete a comment; it keeps its place in its thread. */
  deleteComment(comment: Comment, thread?: Thread): void;
  /** Delete a thread with its comments. */
  deleteThread(thread: Thread): void;
  /** Resolve a thread. A store without resolution leaves this out. */
  resolveThread?(thread: Thread): void;
  /** The people who may be named, matching a query. */
  searchPeople?(query: string): Promise<Array<CommentPerson>>;
  /** Assign a thread to somebody, or to nobody. */
  assignThread?(thread: Thread, person: CommentPerson | null): void;
  registerOnChange(onChange: () => void): () => void;
}

/** How a person is written in a comment and on a thread. */
export const personLabel = (person: CommentPerson): string =>
  person.name || person.handle || person.uid;

/**
 * The uids of the people a comment still names: picked while it was typed,
 * and still written as `@Name` in its words when it is sent.
 */
export function mentionsIn(
  content: string,
  picked: Iterable<CommentPerson>,
): Array<string> {
  const uids: Array<string> = [];
  for (const person of picked) {
    if (
      content.includes(`@${personLabel(person)}`) &&
      !uids.includes(person.uid)
    ) {
      uids.push(person.uid);
    }
  }
  return uids;
}

function createUID(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 5);
}

export function createComment(
  content: string,
  author: string,
  id?: string,
  timeStamp?: number,
  deleted?: boolean,
  mentions?: Array<string>,
): Comment {
  return {
    author,
    content,
    deleted: deleted === undefined ? false : deleted,
    id: id === undefined ? createUID() : id,
    ...(mentions && mentions.length > 0 ? { mentions } : {}),
    // Milliseconds since the epoch: a comment is read long after the page
    // that wrote it, and `performance.now()` counts from that page's load.
    timeStamp: timeStamp === undefined ? Date.now() : timeStamp,
    type: 'comment',
  };
}

export function createThread(
  quote: string,
  comments: Array<Comment>,
  id?: string,
): Thread {
  return {
    comments,
    id: id === undefined ? createUID() : id,
    quote,
    type: 'thread',
  };
}

function markDeleted(comment: Comment): Comment {
  return {
    author: comment.author,
    content: '[Deleted Comment]',
    deleted: true,
    id: comment.id,
    timeStamp: comment.timeStamp,
    type: 'comment',
  };
}

function triggerOnChange(commentStore: CommentStore): void {
  const listeners = commentStore._changeListeners;
  for (const listener of listeners) {
    listener();
  }
}

export class CommentStore implements ICommentStore {
  _editor: LexicalEditor;
  _changeListeners: Set<() => void>;

  constructor(editor: LexicalEditor) {
    this._editor = editor;
    this._changeListeners = new Set();

    // Register update listener to automatically trigger onChange
    this._editor.registerUpdateListener(() => {
      triggerOnChange(this);
    });
  }

  /**
   * Get all comments by reading CommentThreadNode instances from the editor state.
   * These nodes sync automatically via Loro collaboration provider.
   */
  getComments(): Comments {
    const threads: Comments = [];
    this._editor.getEditorState().read(() => {
      const root = $getRoot();
      root.getChildren().forEach(node => {
        if ($isCommentThreadNode(node)) {
          const threadNode = node as CommentThreadNode;
          threads.push({
            type: 'thread',
            id: threadNode.getId(),
            quote: threadNode.getQuote(),
            comments: threadNode.getComments(),
          });
        }
      });
    });
    return threads;
  }

  /**
   * Add a comment to an existing thread or create a new thread.
   * Updates CommentThreadNode in the Lexical editor state, which automatically
   * syncs via Loro collaboration provider.
   */
  addComment(
    commentOrThread: Comment | Thread,
    thread?: Thread,
    _offset?: number,
  ): void {
    this._editor.update(() => {
      if (thread !== undefined && commentOrThread.type === 'comment') {
        // Add comment to existing thread
        const root = $getRoot();
        root.getChildren().forEach(node => {
          if ($isCommentThreadNode(node)) {
            const threadNode = node as CommentThreadNode;
            if (threadNode.getId() === thread.id) {
              threadNode.addComment(commentOrThread);
            }
          }
        });
      } else if (commentOrThread.type === 'thread') {
        // Create new thread node
        const threadNode = $createCommentThreadNode(
          commentOrThread.id,
          commentOrThread.quote,
          commentOrThread.comments,
        );
        $getRoot().append(threadNode);
      }
    });
    // No need to manually trigger onChange - registerUpdateListener handles it
  }

  /** Delete a comment and put its deleted mark in its place. */
  deleteComment(comment: Comment, thread?: Thread): void {
    const deletion = this.deleteCommentOrThread(comment, thread);
    if (deletion !== null) {
      this.addComment(deletion.markedComment, thread, deletion.index);
    }
  }

  deleteThread(thread: Thread): void {
    this.deleteCommentOrThread(thread);
  }

  /**
   * Delete a comment from a thread or delete an entire thread.
   * Updates CommentThreadNode in the Lexical editor state, which automatically
   * syncs via Loro collaboration provider.
   */
  deleteCommentOrThread(
    commentOrThread: Comment | Thread,
    thread?: Thread,
  ): { markedComment: Comment; index: number } | null {
    let commentIndex: number | null = null;

    this._editor.update(() => {
      if (thread !== undefined && commentOrThread.type === 'comment') {
        // Delete comment from existing thread
        const root = $getRoot();
        root.getChildren().forEach(node => {
          if ($isCommentThreadNode(node)) {
            const threadNode = node as CommentThreadNode;
            if (threadNode.getId() === thread.id) {
              const comments = threadNode.getComments();
              commentIndex = comments.findIndex(
                c => c.id === (commentOrThread as Comment).id,
              );
              threadNode.deleteComment((commentOrThread as Comment).id);
            }
          }
        });
      } else {
        // Delete entire thread
        const root = $getRoot();
        root.getChildren().forEach(node => {
          if ($isCommentThreadNode(node)) {
            const threadNode = node as CommentThreadNode;
            if (threadNode.getId() === commentOrThread.id) {
              node.remove();
            }
          }
        });
      }
    });
    // No need to manually trigger onChange - registerUpdateListener handles it

    if (commentOrThread.type === 'comment') {
      return {
        index: commentIndex !== null ? commentIndex : 0,
        markedComment: markDeleted(commentOrThread as Comment),
      };
    }

    return null;
  }

  registerOnChange(onChange: () => void): () => void {
    const changeListeners = this._changeListeners;
    changeListeners.add(onChange);
    return () => {
      changeListeners.delete(onChange);
    };
  }
}

export function useCommentStore(commentStore: ICommentStore): Comments {
  const [comments, setComments] = useState<Comments>(
    commentStore.getComments(),
  );
  useEffect(() => {
    setComments(commentStore.getComments());
    return commentStore.registerOnChange(() => {
      setComments(commentStore.getComments());
    });
  }, [commentStore]);
  return comments;
}
