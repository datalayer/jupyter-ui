/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The Loom recorder, with Loom's SDK stood in for.
 *
 * What is checked is what reaches a block: the video it recorded, as soon as
 * the recording ends — whether or not its author then presses Loom's own
 * "Insert" — and never a video another block recorded.
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type Handler = (video: unknown) => void;

/** The SDK's button: remembers its handlers and what was asked of it. */
class FakeButton {
  handlers = new Map<string, Handler[]>();
  opened = 0;
  on(event: string, handler: Handler) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
  }
  emit(event: string, video: unknown) {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(video);
    }
  }
  openPreRecordPanel() {
    this.opened += 1;
  }
}

const button = new FakeButton();

const setup = jest.fn(async (_: { publicAppId: string }) => ({
  configureButton: () => button,
}));
let supported = true;

jest.mock('@loomhq/record-sdk', () => ({
  setup: (args: { publicAppId: string }) => setup(args),
}));
jest.mock('@loomhq/record-sdk/is-supported', () => ({
  isSupported: async () =>
    supported
      ? { supported: true }
      : { supported: false, error: 'no screen capture' },
}));

import { explainLoomFailure, loomRecorder } from '../loom';

const video = (id: string) => ({
  id,
  title: `Video ${id}`,
  width: 1920,
  height: 1080,
  sharedUrl: `https://www.loom.com/share/${id}`,
});

let appIds = 0;
/** A fresh app id per test: the recorder is set up once per id. */
const freshAppId = () => `app-${(appIds += 1)}`;

beforeEach(() => {
  button.handlers.clear();
  button.opened = 0;
  setup.mockClear();
  supported = true;
});

describe('recording with Loom', () => {
  it('opens Loom and shows the video as soon as the recording ends', async () => {
    const recorder = await loomRecorder(freshAppId());
    const block = jest.fn();
    recorder.record(block);
    expect(button.opened).toBe(1);

    // No "Insert" pressed: the video is in the block all the same.
    button.emit('recording-complete', video('a'));
    expect(block).toHaveBeenCalledWith(video('a'));
  });

  it('gives each video to the block that recorded it', async () => {
    const recorder = await loomRecorder(freshAppId());
    const first = jest.fn();
    const second = jest.fn();
    recorder.record(first);
    button.emit('recording-complete', video('a'));
    recorder.record(second);
    // The first video finishes uploading after the second block pressed Record.
    button.emit('upload-complete', video('a'));
    button.emit('insert-click', video('a'));
    button.emit('recording-complete', video('b'));

    expect(first.mock.calls.map(([v]) => (v as { id: string }).id)).toEqual([
      'a',
      'a',
      'a',
    ]);
    expect(second.mock.calls.map(([v]) => (v as { id: string }).id)).toEqual([
      'b',
    ]);
  });

  it('sets Loom up once per app id', async () => {
    const appId = freshAppId();
    await loomRecorder(appId);
    await loomRecorder(appId);
    expect(setup).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledWith({ publicAppId: appId });
  });

  it('says why when the browser cannot record, and tries again next time', async () => {
    const appId = freshAppId();
    supported = false;
    await expect(loomRecorder(appId)).rejects.toThrow(
      'this browser cannot record with Loom (no screen capture)',
    );
    supported = true;
    await expect(loomRecorder(appId)).resolves.toBeDefined();
  });

  it('names React 18 when the SDK meets React 19', () => {
    expect(
      explainLoomFailure(new TypeError('i.render is not a function')),
    ).toMatch(/needs React 18/);
  });
});
