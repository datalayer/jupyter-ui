/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Recording a video in the page, with nothing but the browser.
 *
 * The screen (`getDisplayMedia`) or the camera (`getUserMedia`), with the
 * microphone when asked, go through a `MediaRecorder` into a file that stays
 * in this page's memory — no account, no key, no upload. That is the whole
 * point and the whole limit: **the recording is lost when the page
 * reloads**, and nobody else editing the document ever sees it. Download is
 * the way to keep one.
 *
 * Recordings live here, by id, and not in the component that shows them: a
 * block's component can be unmounted and mounted again while its recording
 * runs, and the recording must not notice.
 *
 * @module utils/videoRecording
 */

/** What to record: a screen, window or tab — or the camera. */
export type VideoSource = 'screen' | 'camera';

export type VideoRecordingOptions = {
  source: VideoSource;
  /** Record the microphone too. */
  microphone: boolean;
};

/** A recording, as far as the page knows it. */
export type VideoRecording =
  | {
      status: 'recording';
      startedAt: number;
      /** What is being recorded, for a live preview. */
      preview: MediaStream;
    }
  | {
      status: 'recorded';
      url: string;
      blob: Blob;
      mimeType: string;
      durationMs: number;
    }
  | { status: 'failed'; message: string };

type Session = {
  recorder: MediaRecorder;
  release: () => void;
};

const recordings = new Map<string, VideoRecording>();
const sessions = new Map<string, Session>();
const listeners = new Set<() => void>();

function set(id: string, recording: VideoRecording | undefined): void {
  if (recording) {
    recordings.set(id, recording);
  } else {
    recordings.delete(id);
  }
  listeners.forEach(listener => listener());
}

/** Hear about every change to any recording; returns the unsubscribe. */
export function subscribeVideoRecordings(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The recording under `id`, if this page has one. */
export function videoRecordingOf(id: string): VideoRecording | undefined {
  return recordings.get(id);
}

/** An id for a new recording. */
export function newVideoRecordingId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `video-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/** Whether this browser can record at all. */
export function canRecordVideo(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices
  );
}

/**
 * The container to record in: WebM where the browser has it (Chrome,
 * Firefox), MP4 otherwise (Safari).
 */
export function pickVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  return [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ].find(type => MediaRecorder.isTypeSupported(type));
}

/** The file name a download of a recording gets. */
export function videoFileName(recording: { mimeType: string }): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const extension = recording.mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
  return `recording-${stamp}.${extension}`;
}

/** Why a recording did not start, in words for whoever pressed Record. */
export function explainVideoFailure(error: unknown): string {
  const name = error instanceof DOMException ? error.name : '';
  if (name === 'NotAllowedError') {
    return 'Recording did not start: the browser was not allowed to capture.';
  }
  if (name === 'NotFoundError') {
    return 'Recording did not start: there is no camera or microphone to record.';
  }
  const message = error instanceof Error ? error.message : String(error);
  return `Recording did not start: ${message}`;
}

/**
 * One audio track out of several: the screen's sound and the microphone
 * together. A `MediaRecorder` keeps only one audio track, so two are mixed.
 */
function mixAudio(tracks: MediaStreamTrack[]): {
  track: MediaStreamTrack | undefined;
  close: () => void;
} {
  if (tracks.length <= 1) {
    return { track: tracks[0], close: () => undefined };
  }
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  for (const track of tracks) {
    context
      .createMediaStreamSource(new MediaStream([track]))
      .connect(destination);
  }
  return {
    track: destination.stream.getAudioTracks()[0],
    close: () => void context.close(),
  };
}

/**
 * Start recording under `id`.
 *
 * Call it straight from the click: the screen picker needs the click's
 * permission, so it is asked for first, before anything is awaited. When the
 * recording stops — from `stopVideoRecording`, or from the browser's own
 * "Stop sharing" — `onRecorded` is told, and the file is kept here.
 */
export async function startVideoRecording(
  id: string,
  { source, microphone }: VideoRecordingOptions,
  onRecorded?: (
    recording: Extract<VideoRecording, { status: 'recorded' }>,
  ) => void,
): Promise<void> {
  const streams: MediaStream[] = [];
  const release = () =>
    streams.forEach(stream =>
      stream.getTracks().forEach(track => track.stop()),
    );
  try {
    const devices = navigator.mediaDevices;
    let video: MediaStreamTrack | undefined;
    const audio: MediaStreamTrack[] = [];
    if (source === 'screen') {
      const screen = await devices.getDisplayMedia({
        video: true,
        audio: true,
      });
      streams.push(screen);
      video = screen.getVideoTracks()[0];
      audio.push(...screen.getAudioTracks());
      if (microphone) {
        // Without a microphone the screen still records.
        const voice = await devices
          .getUserMedia({ audio: true })
          .catch(() => undefined);
        if (voice) {
          streams.push(voice);
          audio.push(...voice.getAudioTracks());
        }
      }
    } else {
      const camera = await devices.getUserMedia({
        video: true,
        audio: microphone,
      });
      streams.push(camera);
      video = camera.getVideoTracks()[0];
      audio.push(...camera.getAudioTracks());
    }
    if (!video) {
      throw new Error('there was no picture to record');
    }

    const mixed = mixAudio(audio);
    const recorded = new MediaStream(
      mixed.track ? [video, mixed.track] : [video],
    );
    const mimeType = pickVideoMimeType();
    const recorder = new MediaRecorder(
      recorded,
      mimeType ? { mimeType } : undefined,
    );
    const chunks: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = event => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    const releaseAll = () => {
      release();
      mixed.close();
    };
    recorder.onstop = () => {
      releaseAll();
      sessions.delete(id);
      const type = recorder.mimeType || mimeType || 'video/webm';
      const blob = new Blob(chunks, { type });
      const done = {
        status: 'recorded' as const,
        url: URL.createObjectURL(blob),
        blob,
        mimeType: type,
        durationMs: Date.now() - startedAt,
      };
      set(id, done);
      onRecorded?.(done);
    };
    // The browser's own "Stop sharing" ends the recording as Stop does.
    video.addEventListener('ended', () => stopVideoRecording(id));
    sessions.set(id, { recorder, release: releaseAll });
    recorder.start(1000);
    set(id, {
      status: 'recording',
      startedAt,
      preview: new MediaStream([video]),
    });
  } catch (error) {
    release();
    set(id, { status: 'failed', message: explainVideoFailure(error) });
  }
}

/** Stop the recording under `id`, keeping what was recorded. */
export function stopVideoRecording(id: string): void {
  const session = sessions.get(id);
  if (session && session.recorder.state !== 'inactive') {
    session.recorder.stop();
  }
}

/** Forget the recording under `id`, and free the memory it took. */
export function discardVideoRecording(id: string): void {
  const session = sessions.get(id);
  if (session) {
    // Stopped without keeping: the result is thrown away below.
    session.recorder.onstop = null;
    if (session.recorder.state !== 'inactive') {
      session.recorder.stop();
    }
    session.release();
    sessions.delete(id);
  }
  const recording = recordings.get(id);
  if (recording?.status === 'recorded') {
    URL.revokeObjectURL(recording.url);
  }
  set(id, undefined);
}

/**
 * What a video block shows, from what the document says and what this page
 * holds.
 *
 * - `idle`: nothing recorded yet — the recorder;
 * - `recording` / `recorded` / `failed`: this page's recording;
 * - `lost`: the document says there was a recording, and this page does not
 *   have it — the page was reloaded, or it was made in someone else's.
 */
export function videoBlockStatus(
  recorded: boolean,
  recording: VideoRecording | undefined,
): 'idle' | 'lost' | VideoRecording['status'] {
  if (recording) {
    return recording.status;
  }
  return recorded ? 'lost' : 'idle';
}
