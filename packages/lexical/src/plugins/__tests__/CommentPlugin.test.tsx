/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The comment plug-in over comments a service keeps (BENCHMARK.md, B4-01).
 *
 * The threads on the panel are the backend's records, a comment somebody
 * else writes arrives through the subscription, resolving a thread asks the
 * backend and takes the thread off the panel, and a read that comes back
 * after a newer comment was heard does not bring the older copy back.
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { act, useEffect, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createEditor, defineExtension } from 'lexical';
import { LexicalExtensionComposer } from '@lexical/react/LexicalExtensionComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { RichTextExtension } from '@lexical/rich-text';
import { ThemeProvider } from '@primer/react';

// The notebook stack behind the package's index is never reached here.
jest.mock('@datalayer/jupyter-react', () => ({ __esModule: true }));
// Nor is the Loro room: its CRDT ships as browser ESM over WebAssembly. The
// plug-in asks the collaboration context only for the name a comment is
// written under.
jest.mock('@datalayer/lexical-loro', () => ({
  __esModule: true,
  useCollaborationContext: () => ({ name: 'Ada Lovelace' }),
}));
jest.mock('../../components/ExcalidrawModal', () => ({
  __esModule: true,
  default: () => null,
}));

import {
  ApiCommentStore,
  type CommentRecord,
  type CommentsBackend,
  type CommentsListener,
} from '../../components/ApiCommentStore';
import { mentionsIn, type Thread } from '../../components/Commenting';
import { PEOPLE_SEARCH_PAUSE_MS } from '../CommentPeople';
import { CommentsProvider, useComments } from '../../context/CommentsContext';
import { CommentExtension } from '../../extensions/CommentExtension';
import { CommentPlugin } from '../CommentPlugin';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
  true;

const at = (second: number) =>
  `2026-09-10T10:00:${String(second).padStart(2, '0')}.000Z`;

const record = (
  fields: Pick<CommentRecord, 'uid' | 'thread_uid' | 'body'> &
    Partial<CommentRecord>,
): CommentRecord => ({
  anchor: null,
  quote: null,
  author: { uid: 'u-grace', handle: 'grace', name: 'Grace Hopper' },
  status: null,
  deleted: false,
  created_at: at(1),
  updated_at: at(1),
  ...fields,
});

const THREAD = record({
  uid: 'c-1',
  thread_uid: 'c-1',
  body: 'Is this regression real?',
  anchor: { mark_id: 'mark-1' },
  quote: 'pass rate 0.62',
  status: 'open',
  author: { uid: 'u-ada', handle: 'ada', name: 'Ada Lovelace' },
});
const REPLY = record({
  uid: 'c-2',
  thread_uid: 'c-1',
  body: 'Yes, from launch 12.',
  created_at: at(2),
  updated_at: at(2),
});
const DELETED_REPLY = record({
  uid: 'c-3',
  thread_uid: 'c-1',
  body: '',
  deleted: true,
  created_at: at(3),
  updated_at: at(3),
});
const RESOLVED = record({
  uid: 'c-4',
  thread_uid: 'c-4',
  body: 'An evaluator flake?',
  anchor: { block_id: 'block-2' },
  quote: 'judge timeout',
  status: 'resolved',
  created_at: at(4),
  updated_at: at(4),
});
const DELETED_THREAD = record({
  uid: 'c-5',
  thread_uid: 'c-5',
  body: '',
  deleted: true,
  anchor: { case_id: 'case-9' },
  quote: 'never mind',
  status: 'open',
  created_at: at(5),
  updated_at: at(5),
});

function fakeBackend(records: CommentRecord[]) {
  const listeners: CommentsListener[] = [];
  const backend = {
    list: jest.fn<CommentsBackend['list']>(async () => records),
    create: jest.fn<CommentsBackend['create']>(async () => {
      throw new Error('Nothing is written in this test.');
    }),
    delete: jest.fn<CommentsBackend['delete']>(async uid => ({
      ...records.find(known => known.uid === uid)!,
      deleted: true,
      body: '',
      updated_at: at(30),
    })),
    resolve: jest.fn<CommentsBackend['resolve']>(async uid => ({
      ...records.find(known => known.uid === uid)!,
      status: 'resolved',
      updated_at: at(30),
    })),
    subscribe: jest.fn<CommentsBackend['subscribe']>(listener => {
      listeners.push(listener);
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    }),
  };
  return { backend, listeners };
}

const TestExtension = defineExtension({
  name: '[test-comments]',
  dependencies: [RichTextExtension, CommentExtension],
});

function OpenPanel() {
  const { setShowComments } = useComments();
  useEffect(() => setShowComments(true), [setShowComments]);
  return null;
}

function Plugin({ backend }: { backend: CommentsBackend }) {
  const [editor] = useLexicalComposerContext();
  const store = useMemo(
    () => new ApiCommentStore(editor, backend),
    [editor, backend],
  );
  useEffect(() => store.connect(), [store]);
  return <CommentPlugin commentStore={store} showFloatingAddButton={false} />;
}

let root: Root | undefined;
let container: HTMLElement | undefined;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
});

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

async function render(backend: CommentsBackend) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    // Inside Primer's theme, as every host renders the plug-in: the panel's
    // overlay reads its colours from it.
    root!.render(
      <ThemeProvider>
        <LexicalExtensionComposer
          extension={TestExtension}
          contentEditable={null}
        >
          <CommentsProvider>
            <OpenPanel />
            <Plugin backend={backend} />
          </CommentsProvider>
        </LexicalExtensionComposer>
      </ThemeProvider>,
    );
  });
  await settle();
}

const shown = () => document.body.textContent ?? '';

/**
 * A button by its accessible name. Primer's icon buttons are named by their
 * tooltip, through `aria-labelledby`, rather than by `aria-label`.
 */
const buttonNamed = (name: string): HTMLButtonElement | null =>
  Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
    button =>
      button.getAttribute('aria-label') === name ||
      (button.getAttribute('aria-labelledby') ?? '')
        .split(' ')
        .some(
          (id: string) =>
            id !== '' && document.getElementById(id)?.textContent === name,
        ),
  ) ?? null;

describe('the comment plug-in over comments a service keeps', () => {
  it('shows the open threads of the backend, each with its comments in order', async () => {
    const { backend } = fakeBackend([
      REPLY,
      RESOLVED,
      THREAD,
      DELETED_REPLY,
      DELETED_THREAD,
    ]);
    await render(backend);
    expect(backend.list).toHaveBeenCalled();
    expect(shown()).toContain('pass rate 0.62');
    expect(shown().indexOf('Is this regression real?')).toBeLessThan(
      shown().indexOf('Yes, from launch 12.'),
    );
    expect(shown()).toContain('Ada Lovelace');
    expect(shown()).toContain('Grace Hopper');
    expect(shown()).toContain('[Deleted Comment]');
    expect(shown()).not.toContain('judge timeout');
    expect(shown()).not.toContain('never mind');
  });

  it('shows a comment somebody else writes as it arrives', async () => {
    const { backend, listeners } = fakeBackend([THREAD]);
    await render(backend);
    expect(shown()).not.toContain('A rerun confirms it.');
    await act(async () => {
      listeners[0].comment(
        record({
          uid: 'c-9',
          thread_uid: 'c-1',
          body: 'A rerun confirms it.',
          created_at: at(9),
          updated_at: at(9),
        }),
      );
    });
    expect(shown()).toContain('A rerun confirms it.');
  });

  it('resolves a thread through the backend and takes it off the panel', async () => {
    const { backend } = fakeBackend([THREAD, REPLY]);
    await render(backend);
    const resolve = buttonNamed('Resolve thread');
    expect(resolve).not.toBeNull();
    await act(async () => {
      resolve!.click();
    });
    await settle();
    expect(backend.resolve).toHaveBeenCalledWith('c-1');
    expect(shown()).not.toContain('pass rate 0.62');
  });
});

describe('the store', () => {
  it('keeps a comment heard while a read was on its way over the older copy the read brings', async () => {
    const { backend, listeners } = fakeBackend([]);
    let answer: (records: CommentRecord[]) => void = () => undefined;
    backend.list.mockImplementation(
      () =>
        new Promise<CommentRecord[]>(resolve => {
          answer = resolve;
        }),
    );
    const store = new ApiCommentStore(createEditor(), backend);
    const stop = store.connect();
    listeners[0].comment({
      ...REPLY,
      body: 'Yes, from launch 12 (edited).',
      updated_at: at(20),
    });
    answer([THREAD, REPLY]);
    await new Promise(resolve => setTimeout(resolve, 0));
    const [thread] = store.getComments() as Thread[];
    expect(thread.comments.map(comment => comment.content)).toEqual([
      'Is this regression real?',
      'Yes, from launch 12 (edited).',
    ]);
    stop();
    expect(listeners).toHaveLength(0);
  });

  it('reads again each time the subscription starts', async () => {
    const { backend, listeners } = fakeBackend([THREAD]);
    const store = new ApiCommentStore(createEditor(), backend);
    store.connect();
    listeners[0].ready();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(backend.list).toHaveBeenCalledTimes(2);
  });

  it('tells of a write the backend refused', async () => {
    const { backend } = fakeBackend([THREAD]);
    const onError = jest.fn();
    const store = new ApiCommentStore(createEditor(), backend, { onError });
    await store.refresh();
    const [thread] = store.getComments() as Thread[];
    store.addComment(
      {
        type: 'comment',
        id: 'local',
        author: 'Ada',
        content: 'A reply.',
        deleted: false,
        timeStamp: Date.now(),
      },
      thread,
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(backend.create).toHaveBeenCalledWith({
      body: 'A reply.',
      thread_uid: 'c-1',
    });
    expect(onError).toHaveBeenCalled();
  });
});

describe('the people a comment names', () => {
  it('keeps the mentions still written in the words', () => {
    const grace = { uid: 'u-grace', name: 'Grace Hopper' };
    const alan = { uid: 'u-alan', handle: 'alan' };
    expect(
      mentionsIn('Thanks @Grace Hopper, and @alan', [grace, alan, grace]),
    ).toEqual(['u-grace', 'u-alan']);
    expect(mentionsIn('Thanks, nobody', [grace])).toEqual([]);
  });

  it('opens a thread with the mentions of its first comment', async () => {
    const { backend } = fakeBackend([]);
    backend.create.mockResolvedValue({ ...THREAD, mentions: ['u-grace'] });
    const store = new ApiCommentStore(createEditor(), backend);
    store.addComment({
      type: 'thread',
      id: 'mark-1',
      quote: 'pass rate 0.62',
      comments: [
        {
          type: 'comment',
          id: 'local',
          author: 'Ada',
          content: 'Is this real, @Grace Hopper?',
          deleted: false,
          timeStamp: Date.now(),
          mentions: ['u-grace'],
        },
      ],
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(backend.create).toHaveBeenCalledWith({
      body: 'Is this real, @Grace Hopper?',
      anchor: { mark_id: 'mark-1' },
      quote: 'pass rate 0.62',
      mentions: ['u-grace'],
    });
  });

  it('assigns a thread from its header to a person found by search', async () => {
    const { backend } = fakeBackend([THREAD]);
    const grace = { uid: 'u-grace', handle: 'grace', name: 'Grace Hopper' };
    const searchPeople = jest.fn<NonNullable<CommentsBackend['searchPeople']>>(
      async () => [grace],
    );
    const assign = jest.fn<NonNullable<CommentsBackend['assign']>>(
      async (_uid, assigneeUid) => ({
        ...THREAD,
        assignee: assigneeUid ? grace : null,
        updated_at: at(40),
      }),
    );
    await render({ ...backend, searchPeople, assign });
    expect(shown()).toContain('Not assigned');
    await act(async () => {
      buttonNamed('Assign thread')!.click();
    });
    const input = document.body.querySelector<HTMLInputElement>(
      'input[aria-label="Find a person to assign"]',
    );
    expect(input).not.toBeNull();
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )!.set!.call(input, 'gra');
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      await new Promise(resolve =>
        setTimeout(resolve, PEOPLE_SEARCH_PAUSE_MS + 50),
      );
    });
    expect(searchPeople).toHaveBeenCalledWith('gra');
    const found = Array.from(
      document.body.querySelectorAll<HTMLButtonElement>('button'),
    ).find(button => button.textContent?.trim() === 'Grace Hopper');
    expect(found).toBeDefined();
    await act(async () => {
      found!.click();
    });
    await settle();
    expect(assign).toHaveBeenCalledWith('c-1', 'u-grace');
    expect(shown()).toContain('Assigned to Grace Hopper');
  });
});
