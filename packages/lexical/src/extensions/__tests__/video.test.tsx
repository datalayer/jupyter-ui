/**
 * @jest-environment jsdom
 */
/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The video block and the page's recorder, with a camera made up for the
 * occasion.
 *
 * jsdom has no media devices and no `MediaRecorder`, so these tests bring
 * their own: tracks that remember being stopped, a recorder that hands over
 * one chunk when it stops. What they check is the recorder's bookkeeping —
 * a recording starts, stops on Stop and on the browser's "Stop sharing",
 * releases the camera, is kept in memory and freed on discard, and a block
 * deleted mid-recording does not leave the camera running — and what the
 * document keeps of it.
 */

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  buildEditorFromExtensions,
  type LexicalEditorWithDispose,
} from '@lexical/extension';
import { RichTextExtension } from '@lexical/rich-text';
import {
  $createParagraphNode,
  $getRoot,
  $nodesOfType,
  defineExtension,
} from 'lexical';
import { INSERT_VIDEO_COMMAND, VideoExtension } from '../VideoExtension';
import { $createVideoNode, VideoNode } from '../../nodes/VideoNode';
import {
  discardVideoRecording,
  pickVideoMimeType,
  startVideoRecording,
  stopVideoRecording,
  subscribeVideoRecordings,
  videoBlockStatus,
  videoRecordingOf,
} from '../../utils/videoRecording';

class FakeTrack {
  stopped = false;
  private ended: Array<() => void> = [];
  constructor(readonly kind: 'audio' | 'video') {}
  stop() {
    this.stopped = true;
  }
  addEventListener(type: string, listener: () => void) {
    if (type === 'ended') {
      this.ended.push(listener);
    }
  }
  /** What the browser does when its "Stop sharing" is pressed. */
  end() {
    this.ended.forEach(listener => listener());
  }
}

class FakeStream {
  constructor(readonly tracks: FakeTrack[] = []) {}
  getTracks() {
    return this.tracks;
  }
  getVideoTracks() {
    return this.tracks.filter(track => track.kind === 'video');
  }
  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }
}

class FakeRecorder {
  static isTypeSupported(type: string) {
    return type === 'video/webm';
  }
  state: 'inactive' | 'recording' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  constructor(_stream: FakeStream, options?: { mimeType?: string }) {
    this.mimeType = options?.mimeType ?? '';
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({ data: new Blob(['frames']) });
    this.onstop?.();
  }
}

let camera: FakeTrack;
let voice: FakeTrack;
let refuse: DOMException | undefined;
const globals = globalThis as unknown as Record<string, unknown>;

beforeEach(() => {
  camera = new FakeTrack('video');
  voice = new FakeTrack('audio');
  refuse = undefined;
  globals.MediaRecorder = FakeRecorder;
  globals.MediaStream = FakeStream;
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: async () => {
        if (refuse) {
          throw refuse;
        }
        return new FakeStream([camera, voice]);
      },
      getDisplayMedia: async () => new FakeStream([camera]),
    },
  });
  URL.createObjectURL = jest.fn(() => 'blob:recording') as never;
  URL.revokeObjectURL = jest.fn() as never;
});

const editors: LexicalEditorWithDispose[] = [];

afterEach(() => {
  while (editors.length > 0) {
    editors.pop()!.dispose();
  }
  delete globals.MediaRecorder;
  delete globals.MediaStream;
});

function build(): LexicalEditorWithDispose {
  const editor = buildEditorFromExtensions(
    defineExtension({
      name: '[test-video]',
      dependencies: [RichTextExtension, VideoExtension],
    }),
  );
  editors.push(editor);
  return editor;
}

/** Let a recorder's promises settle. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0));

describe('the page recorder', () => {
  it('records the camera, stops on Stop, and keeps the file in memory', async () => {
    const onRecorded = jest.fn();
    await startVideoRecording(
      'one',
      { source: 'camera', microphone: true },
      onRecorded,
    );
    expect(videoRecordingOf('one')?.status).toBe('recording');

    stopVideoRecording('one');
    const recording = videoRecordingOf('one');
    expect(recording?.status).toBe('recorded');
    expect(recording).toMatchObject({
      url: 'blob:recording',
      mimeType: 'video/webm',
    });
    expect(onRecorded).toHaveBeenCalledTimes(1);
    // The camera and the microphone are let go of.
    expect(camera.stopped && voice.stopped).toBe(true);
    discardVideoRecording('one');
  });

  it('stops when the browser stops sharing', async () => {
    await startVideoRecording('shared', {
      source: 'screen',
      microphone: false,
    });
    expect(videoRecordingOf('shared')?.status).toBe('recording');
    camera.end();
    expect(videoRecordingOf('shared')?.status).toBe('recorded');
    discardVideoRecording('shared');
  });

  it('frees the file on discard, and tells whoever listens', async () => {
    await startVideoRecording('gone', { source: 'camera', microphone: false });
    stopVideoRecording('gone');
    const heard = jest.fn();
    const unsubscribe = subscribeVideoRecordings(heard);
    discardVideoRecording('gone');
    unsubscribe();
    expect(videoRecordingOf('gone')).toBeUndefined();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:recording');
    expect(heard).toHaveBeenCalled();
  });

  it('says so when the browser is not allowed to capture', async () => {
    refuse = new DOMException('denied', 'NotAllowedError');
    await startVideoRecording('refused', {
      source: 'camera',
      microphone: true,
    });
    expect(videoRecordingOf('refused')).toEqual({
      status: 'failed',
      message:
        'Recording did not start: the browser was not allowed to capture.',
    });
    discardVideoRecording('refused');
  });

  it('records WebM where the browser has it', () => {
    expect(pickVideoMimeType()).toBe('video/webm');
  });
});

describe('a video block', () => {
  it('says what it shows, from the document and the page', () => {
    expect(videoBlockStatus(false, undefined)).toBe('idle');
    // The document says there was a video; this page has not got it.
    expect(videoBlockStatus(true, undefined)).toBe('lost');
    expect(
      videoBlockStatus(true, {
        status: 'failed',
        message: 'no',
      }),
    ).toBe('failed');
  });

  it('is inserted ready to record, each with a recording of its own', async () => {
    const editor = build();
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        $getRoot().append(paragraph);
        paragraph.select();
      },
      { discrete: true },
    );
    expect(editor.dispatchCommand(INSERT_VIDEO_COMMAND, undefined)).toBe(true);
    expect(editor.dispatchCommand(INSERT_VIDEO_COMMAND, undefined)).toBe(true);
    await settle();
    editor.getEditorState().read(() => {
      const videos = $nodesOfType(VideoNode);
      expect(videos).toHaveLength(2);
      expect(videos.every(video => !video.isRecorded())).toBe(true);
      expect(videos[0].getRecordingId()).not.toBe(videos[1].getRecordingId());
    });
  });

  it('keeps in its JSON which recording it had, not the recording', () => {
    const editor = build();
    editor.update(
      () => {
        const video = $createVideoNode();
        video.setRecorded(true);
        $getRoot().append(video);
      },
      { discrete: true },
    );
    const json = editor.getEditorState().toJSON();
    const saved = (
      json.root.children as unknown as Array<Record<string, unknown>>
    ).find(child => child.type === 'video')!;
    expect(Object.keys(saved).sort()).toEqual(
      ['format', 'recorded', 'recordingId', 'type', 'version'].sort(),
    );

    const other = build();
    other.setEditorState(other.parseEditorState(JSON.stringify(json)));
    other.getEditorState().read(() => {
      const [video] = $nodesOfType(VideoNode);
      expect(video.getRecordingId()).toBe(saved.recordingId);
      expect(video.isRecorded()).toBe(true);
    });
  });

  it('stops its recording when it is deleted, and keeps what was recorded', async () => {
    const editor = build();
    // Lexical reports mutations as it draws them: this editor has to draw.
    editor.setRootElement(document.createElement('div'));
    let id = '';
    editor.update(
      () => {
        const video = $createVideoNode();
        id = video.getRecordingId();
        $getRoot().append(video);
      },
      { discrete: true },
    );
    await startVideoRecording(id, { source: 'camera', microphone: true });
    expect(videoRecordingOf(id)?.status).toBe('recording');

    editor.update(() => $nodesOfType(VideoNode)[0].remove(), {
      discrete: true,
    });
    expect(camera.stopped).toBe(true);
    // Kept, so an undo brings the block back with its video.
    expect(videoRecordingOf(id)?.status).toBe('recorded');
    discardVideoRecording(id);
  });
});
