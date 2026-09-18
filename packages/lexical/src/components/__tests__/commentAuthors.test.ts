/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Who wrote a comment, as a comment keeps it.
 *
 * A signed-in author is a principal — a kind and a uid, what an avatar is
 * found by; somebody anonymous is a name. Both are kept beside the name
 * every comment has always carried, so a comment written before principals
 * were kept still reads, as somebody anonymous, and a document written now
 * still shows its authors' names to an older editor.
 */

import { describe, expect, it } from '@jest/globals';
import { $getRoot, createEditor } from 'lexical';
import {
  anonymousAuthor,
  authorLabel,
  authorOf,
  createComment,
  type Comment,
  type CommentAuthor,
} from '../Commenting';
import { threadsOf, type CommentRecord } from '../ApiCommentStore';
import {
  $createCommentThreadNode,
  $isCommentThreadNode,
  CommentThreadNode,
} from '../../nodes/CommentThreadNode';

const ADA: CommentAuthor = {
  kind: 'user',
  uid: 'u-ada',
  handle: 'ada',
  name: 'Ada Lovelace',
  avatarUrl: 'https://example.com/ada.png',
};

describe('a comment author', () => {
  it('is the principal given, and writes its name beside it', () => {
    const comment = createComment('Looks right.', ADA);
    expect(comment.authorPrincipal).toEqual(ADA);
    expect(comment.author).toBe('Ada Lovelace');
    expect(authorOf(comment)).toEqual(ADA);
  });

  it('is somebody anonymous when only a name is given', () => {
    const comment = createComment('Looks right.', 'Collaborator 2');
    expect(authorOf(comment)).toEqual({
      kind: 'anonymous',
      name: 'Collaborator 2',
    });
    expect(comment.author).toBe('Collaborator 2');
  });

  it('reads a comment older than principals as somebody anonymous by its name', () => {
    const legacy: Comment = {
      type: 'comment',
      id: 'c',
      author: 'Grace',
      content: 'An old one.',
      deleted: false,
      timeStamp: 0,
    };
    expect(authorOf(legacy)).toEqual(anonymousAuthor('Grace'));
  });

  it('is written by its name, then its handle, then its uid', () => {
    expect(authorLabel(ADA)).toBe('Ada Lovelace');
    expect(authorLabel({ kind: 'user', uid: 'u-1', handle: 'ada' })).toBe(
      'ada',
    );
    expect(authorLabel({ kind: 'user', uid: 'u-1' })).toBe('u-1');
    expect(authorLabel({ kind: 'anonymous' })).toBe('Anonymous');
  });
});

describe('an author a service recorded', () => {
  const record = (author: CommentRecord['author']): CommentRecord => ({
    uid: 'c-1',
    thread_uid: 'c-1',
    anchor: { mark_id: 'm-1' },
    quote: 'the quote',
    body: 'Is this real?',
    author,
    status: 'open',
    deleted: false,
    created_at: '2026-09-18T10:00:00.000Z',
    updated_at: '2026-09-18T10:00:00.000Z',
  });
  const firstAuthor = (records: CommentRecord[]) => {
    const [thread] = threadsOf(records);
    if (thread?.type !== 'thread') {
      throw new Error('no thread');
    }
    return thread.comments[0];
  };

  it('is the signed-in user the service took from the token', () => {
    const comment = firstAuthor([
      record({ uid: 'u-ada', handle: 'ada', name: 'Ada Lovelace' }),
    ]);
    expect(comment.authorPrincipal).toEqual({
      kind: 'user',
      uid: 'u-ada',
      handle: 'ada',
      name: 'Ada Lovelace',
    });
    expect(comment.author).toBe('Ada Lovelace');
  });

  it('keeps the agent that wrote for the user', () => {
    const comment = firstAuthor([
      record({ uid: 'u-ada', handle: 'ada', name: null, agent_uid: 'a-7' }),
    ]);
    expect(comment.authorPrincipal).toMatchObject({
      kind: 'user',
      uid: 'u-ada',
      agentUid: 'a-7',
    });
    expect(comment.author).toBe('ada');
  });
});

describe('a comment kept in the document', () => {
  const editor = () =>
    createEditor({
      nodes: [CommentThreadNode],
      onError: error => {
        throw error;
      },
    });

  it('keeps its author principal through the document JSON', () => {
    const writer = editor();
    writer.update(
      () => {
        $getRoot().append(
          $createCommentThreadNode('t-1', 'the quote', [
            createComment('Mine.', ADA),
            createComment('Theirs.', 'Collaborator 2'),
          ]),
        );
      },
      { discrete: true },
    );
    const json = JSON.stringify(writer.getEditorState().toJSON());

    const reader = editor();
    reader.setEditorState(reader.parseEditorState(json));
    const authors = reader.getEditorState().read(() => {
      const node = $getRoot().getChildren().find($isCommentThreadNode);
      return node?.getComments().map(authorOf);
    });
    expect(authors).toEqual([
      ADA,
      { kind: 'anonymous', name: 'Collaborator 2' },
    ]);
  });

  it('reads a thread saved before principals, as somebody anonymous', () => {
    const reader = editor();
    reader.setEditorState(
      reader.parseEditorState(
        JSON.stringify({
          root: {
            type: 'root',
            version: 1,
            format: '',
            indent: 0,
            direction: null,
            children: [
              {
                type: 'comment-thread',
                version: 1,
                id: 't-1',
                quote: 'the quote',
                comments: [
                  {
                    type: 'comment',
                    id: 'c-1',
                    author: 'Grace',
                    content: 'Old.',
                    deleted: false,
                    timeStamp: 0,
                  },
                ],
              },
            ],
          },
        }),
      ),
    );
    const authors = reader.getEditorState().read(() => {
      const node = $getRoot().getChildren().find($isCommentThreadNode);
      return node?.getComments().map(authorOf);
    });
    expect(authors).toEqual([{ kind: 'anonymous', name: 'Grace' }]);
  });
});
