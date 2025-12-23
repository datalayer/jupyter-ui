/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
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

export type Comment = {
  author: string;
  content: string;
  deleted: boolean;
  id: string;
  timeStamp: number;
  type: 'comment';
};

export type Thread = {
  comments: Array<Comment>;
  id: string;
  quote: string;
  type: 'thread';
};

export type Comments = Array<Thread | Comment>;

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
): Comment {
  return {
    author,
    content,
    deleted: deleted === undefined ? false : deleted,
    id: id === undefined ? createUID() : id,
    timeStamp: timeStamp === undefined ? performance.now() : timeStamp,
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

export class CommentStore {
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
    offset?: number,
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

export function useCommentStore(commentStore: CommentStore): Comments {
  const [comments, setComments] = useState<Comments>(
    commentStore.getComments(),
  );
  useEffect(() => {
    return commentStore.registerOnChange(() => {
      setComments(commentStore.getComments());
    });
  }, [commentStore]);
  return comments;
}
