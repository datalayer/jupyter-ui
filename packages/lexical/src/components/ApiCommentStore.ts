/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Comment threads kept by a service rather than in the document.
 *
 * `CommentStore` keeps each thread as a node of the document, which is all a
 * local file has. A platform document's comments are records of a service,
 * where they can be listed, assigned and notified without opening the
 * document: this store reads them from a `CommentsBackend`, writes through
 * it, and hears of what other people write. The document keeps only the
 * highlight, the mark a thread names as its anchor. A backend that can search
 * people lets the plug-in mention and assign them.
 *
 * @module components/ApiCommentStore
 */

import type { LexicalEditor } from 'lexical';
import { $isMarkNode, $unwrapMarkNode } from '@lexical/mark';
import { $dfs } from '@lexical/utils';
import {
  anonymousAuthor,
  authorLabel,
  type Comment,
  type CommentAuthor,
  type CommentPerson,
  type Comments,
  type ICommentStore,
  type Thread,
} from './Commenting';

/** What a thread is about: exactly one of these. */
export type CommentAnchor = Partial<
  Record<'mark_id' | 'block_id' | 'cell_id' | 'case_id' | 'datum', string>
>;

/** A comment as the service answers it. */
export interface CommentRecord {
  uid: string;
  /** The uid of the thread's first comment; that comment's own. */
  thread_uid: string;
  anchor: CommentAnchor | null;
  quote: string | null;
  body: string;
  /**
   * Who wrote it, as the service recorded it from the writer's token — not
   * from anything the client sent. `agent_uid` when an agent wrote it for
   * them.
   */
  author: CommentPerson & { agent_uid?: string };
  /** The uids of the people it mentions. */
  mentions?: string[];
  /** A thread's assignee. */
  assignee?: CommentPerson | null;
  status: 'open' | 'resolved' | null;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

/** A comment to write: a thread and its anchor, or a reply in a thread. */
export interface NewComment {
  body: string;
  anchor?: CommentAnchor;
  quote?: string;
  thread_uid?: string;
  mentions?: string[];
}

export interface CommentsListener {
  /** A comment was written or changed, by anybody. */
  comment(record: CommentRecord): void;
  /**
   * The subscription started, or started again: what was written before it
   * may have been missed.
   */
  ready(): void;
}

/** Where an `ApiCommentStore` keeps its comments. */
export interface CommentsBackend {
  list(): Promise<CommentRecord[]>;
  create(comment: NewComment): Promise<CommentRecord>;
  delete(uid: string): Promise<CommentRecord>;
  resolve(uid: string): Promise<CommentRecord>;
  subscribe(listener: CommentsListener): () => void;
  /** The people who may be named, matching a query. */
  searchPeople?(query: string): Promise<CommentPerson[]>;
  /** Assign the thread `uid` to somebody, or to nobody. */
  assign?(uid: string, assigneeUid: string | null): Promise<CommentRecord>;
}

export interface ApiCommentStoreOptions {
  /** Told of a read, a write or a search the backend refused. */
  onError?: (error: unknown) => void;
}

const DELETED_CONTENT = '[Deleted Comment]';

const isThread = (record: CommentRecord): boolean =>
  record.uid === record.thread_uid;

/** The id a thread has in the editor: its mark's, when it has one. */
const threadIdOf = (record: CommentRecord): string =>
  record.anchor?.mark_id ?? record.uid;

const inWritingOrder = (a: CommentRecord, b: CommentRecord): number => {
  if (a.created_at !== b.created_at) {
    return a.created_at < b.created_at ? -1 : 1;
  }
  return a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0;
};

const newer = (
  known: CommentRecord | undefined,
  heard: CommentRecord,
): CommentRecord =>
  known !== undefined && known.updated_at > heard.updated_at ? known : heard;

/**
 * The principal behind a record's author. The service only takes comments
 * from somebody signed in, so an author with a uid is a user.
 */
const authorOfRecord = (record: CommentRecord): CommentAuthor => {
  const { uid, handle, name, agent_uid: agentUid } = record.author;
  if (!uid) {
    return anonymousAuthor(name || handle);
  }
  return {
    kind: 'user',
    uid,
    handle: handle ?? null,
    name: name ?? null,
    ...(agentUid ? { agentUid } : {}),
  };
};

const commentOf = (record: CommentRecord): Comment => ({
  type: 'comment',
  id: record.uid,
  author: authorLabel(authorOfRecord(record)),
  authorPrincipal: authorOfRecord(record),
  content: record.deleted ? DELETED_CONTENT : record.body,
  deleted: record.deleted,
  ...(record.mentions && record.mentions.length > 0
    ? { mentions: record.mentions }
    : {}),
  timeStamp: Date.parse(record.created_at),
});

/**
 * The open threads, each with its comments in the order they were written.
 * A resolved or deleted thread is not among them; a deleted reply keeps its
 * place in its thread.
 */
export function threadsOf(records: Iterable<CommentRecord>): Comments {
  const written = [...records].sort(inWritingOrder);
  const replies = new Map<string, CommentRecord[]>();
  for (const record of written) {
    if (!isThread(record)) {
      replies.set(record.thread_uid, [
        ...(replies.get(record.thread_uid) ?? []),
        record,
      ]);
    }
  }
  return written
    .filter(
      record => isThread(record) && !record.deleted && record.status === 'open',
    )
    .map(root => ({
      type: 'thread' as const,
      id: threadIdOf(root),
      quote: root.quote ?? '',
      assignee: root.assignee ?? null,
      comments: [root, ...(replies.get(root.uid) ?? [])].map(commentOf),
    }));
}

const withMentions = (mentions: string[] | undefined) =>
  mentions && mentions.length > 0 ? { mentions } : {};

export class ApiCommentStore implements ICommentStore {
  /** Present when the backend searches people. */
  readonly searchPeople?: (query: string) => Promise<CommentPerson[]>;
  /** Present when the backend assigns threads. */
  readonly assignThread?: (
    thread: Thread,
    person: CommentPerson | null,
  ) => void;

  private readonly _editor: LexicalEditor;
  private readonly _backend: CommentsBackend;
  private readonly _options: ApiCommentStoreOptions;
  private readonly _listeners = new Set<() => void>();
  /** What was heard while a read was on its way, a map per read. */
  private readonly _heardDuringReads = new Set<Map<string, CommentRecord>>();
  private _records = new Map<string, CommentRecord>();
  private _comments: Comments = [];

  constructor(
    editor: LexicalEditor,
    backend: CommentsBackend,
    options: ApiCommentStoreOptions = {},
  ) {
    this._editor = editor;
    this._backend = backend;
    this._options = options;
    const { searchPeople, assign } = backend;
    if (searchPeople) {
      this.searchPeople = query =>
        searchPeople.call(backend, query).catch((error: unknown) => {
          this._options.onError?.(error);
          throw error;
        });
    }
    if (assign) {
      this.assignThread = (thread, person) =>
        this._write(() =>
          assign.call(
            backend,
            this._threadRecord(thread).uid,
            person?.uid ?? null,
          ),
        );
    }
  }

  /** Read the comments and follow them; answers what stops following. */
  connect(): () => void {
    const unsubscribe = this._backend.subscribe({
      comment: record => this._heard(record),
      ready: () => void this.refresh(),
    });
    void this.refresh();
    return unsubscribe;
  }

  /**
   * Read every comment again. A comment heard while the read was on its way
   * is kept over the older copy the read may bring back.
   */
  async refresh(): Promise<void> {
    const heard = new Map<string, CommentRecord>();
    this._heardDuringReads.add(heard);
    try {
      const listed = await this._backend.list();
      const records = new Map(listed.map(record => [record.uid, record]));
      for (const [uid, record] of heard) {
        records.set(uid, newer(records.get(uid), record));
      }
      this._records = records;
      this._changed();
    } catch (error) {
      this._options.onError?.(error);
    } finally {
      this._heardDuringReads.delete(heard);
    }
  }

  getComments(): Comments {
    return this._comments;
  }

  addComment(commentOrThread: Comment | Thread, thread?: Thread): void {
    if (commentOrThread.type === 'thread') {
      const id = commentOrThread.id;
      const first = commentOrThread.comments[0];
      this._write(
        () =>
          this._backend.create({
            body: first?.content ?? '',
            anchor: { mark_id: id },
            quote: commentOrThread.quote,
            ...withMentions(first?.mentions),
          }),
        // The highlight was made for a thread the service did not keep.
        () => this._unmark(id),
      );
    } else if (thread !== undefined) {
      this._write(() =>
        this._backend.create({
          body: commentOrThread.content,
          thread_uid: this._threadRecord(thread).uid,
          ...withMentions(commentOrThread.mentions),
        }),
      );
    } else {
      this._options.onError?.(new Error('A comment is written in a thread.'));
    }
  }

  deleteComment(comment: Comment): void {
    this._write(() => this._backend.delete(comment.id));
  }

  deleteThread(thread: Thread): void {
    this._write(() => this._backend.delete(this._threadRecord(thread).uid));
  }

  resolveThread(thread: Thread): void {
    this._write(() => this._backend.resolve(this._threadRecord(thread).uid));
  }

  registerOnChange(onChange: () => void): () => void {
    this._listeners.add(onChange);
    return () => {
      this._listeners.delete(onChange);
    };
  }

  private _write(request: () => Promise<CommentRecord>, undo?: () => void) {
    Promise.resolve()
      .then(request)
      .then(
        record => this._heard(record),
        error => {
          undo?.();
          this._options.onError?.(error);
        },
      );
  }

  private _threadRecord(thread: Thread): CommentRecord {
    for (const record of this._records.values()) {
      if (isThread(record) && threadIdOf(record) === thread.id) {
        return record;
      }
    }
    throw new Error(`The thread ${thread.id} is not one the store read.`);
  }

  private _heard(record: CommentRecord): void {
    for (const heard of this._heardDuringReads) {
      heard.set(record.uid, newer(heard.get(record.uid), record));
    }
    this._records.set(record.uid, newer(this._records.get(record.uid), record));
    this._changed();
  }

  private _changed(): void {
    this._comments = threadsOf(this._records.values());
    for (const listener of this._listeners) {
      listener();
    }
  }

  private _unmark(id: string): void {
    this._editor.update(() => {
      for (const { node } of $dfs()) {
        if ($isMarkNode(node) && node.getIDs().includes(id)) {
          node.deleteID(id);
          if (node.getIDs().length === 0) {
            $unwrapMarkNode(node);
          }
        }
      }
    });
  }
}
