/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Loom, as far as a document needs it: reading a video's address, asking
 * Loom what the video is, and recording a new one.
 *
 * **Nothing here holds a key.** Recording needs a Loom *public app id*, and
 * this package is public, so the id is the host's to give — through
 * `configExtension(LoomExtension, { publicAppId })`, from wherever it keeps
 * its configuration. The examples read `LOOM_PUBLIC_APP_ID` from the
 * environment. Without one, a Loom block still shows videos; it only cannot
 * record.
 *
 * **The recorder runs on React 18.** `@loomhq/record-sdk` peers on React 18,
 * imports React from the host and mounts through `ReactDOM.render`, which
 * React 19 removed. Under JupyterLab, which shares its React 18, it just
 * works. A React 19 host has to give the SDK a React 18 of its own: this
 * package's `webpack.config.js` and `vite.config.ts` show how, with the pair
 * installed by `npm run install:react18`. The SDK is imported only when
 * somebody presses Record, so a host that has not done that loses recording,
 * with a message saying why, and nothing else.
 *
 * @module utils/loom
 */

import type { LexicalEditor } from 'lexical';

/** The name `LoomExtension` is registered under, for reading its config. */
export const LOOM_EXTENSION_NAME = '@datalayer/jupyter-lexical/Loom';

/*
 * The app id of an editor built with `LexicalComposer` and `LoomPlugin`,
 * which has no extension config to keep it in.
 */
const pluginAppIds = new WeakMap<LexicalEditor, string>();

/**
 * Give `editor`'s Loom blocks `publicAppId` to record with, or take it away.
 *
 * @returns The function that takes it away again.
 */
export function setLoomPublicAppId(
  editor: LexicalEditor,
  publicAppId: string | undefined,
): () => void {
  if (publicAppId) {
    pluginAppIds.set(editor, publicAppId);
  } else {
    pluginAppIds.delete(editor);
  }
  return () => {
    if (pluginAppIds.get(editor) === publicAppId) {
      pluginAppIds.delete(editor);
    }
  };
}

/** The app id `LoomPlugin` gave `editor`, if it gave one. */
export function loomPublicAppIdOf(editor: LexicalEditor): string | undefined {
  return pluginAppIds.get(editor);
}

/** A Loom video, as a block keeps it. */
export type LoomVideoData = {
  /** The share address: `https://www.loom.com/share/<id>`. */
  url: string;
  title?: string;
  /** The recording's size, kept for its shape; 16:9 when unknown. */
  width?: number;
  height?: number;
};

/** A Loom video id: 32 hexadecimal characters. */
const LOOM_URL =
  /^https?:\/\/(?:www\.)?loom\.com\/(?:share|embed)\/(?:[^/?#]*-)?([0-9a-f]{32})(?:[/?#].*)?$/i;

/** The id of the video at `url`, or `null` when it is not a Loom video. */
export function loomVideoId(url: string): string | null {
  const match = LOOM_URL.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}

/** The share address of a Loom video: the one to keep and to link to. */
export function loomShareUrl(id: string): string {
  return `https://www.loom.com/share/${id}`;
}

/** The player of a Loom video, for an iframe. */
export function loomEmbedUrl(id: string): string {
  return `https://www.loom.com/embed/${id}`;
}

/**
 * What Loom says about the video at `url`: its title and the size it was
 * recorded at, through oEmbed.
 *
 * Only a nicety — a block needs the address and nothing else — so a failure
 * gives back the address alone rather than stopping the insertion.
 */
export async function describeLoomVideo(url: string): Promise<LoomVideoData> {
  const id = loomVideoId(url);
  if (!id) {
    throw new Error(`Not a Loom video address: ${url}`);
  }
  const shareUrl = loomShareUrl(id);
  try {
    const { oembed } = await import('@loomhq/loom-embed');
    const { title, width, height } = await oembed(shareUrl);
    return {
      url: shareUrl,
      title: title || undefined,
      width: Number(width) || undefined,
      height: Number(height) || undefined,
    };
  } catch {
    return { url: shareUrl };
  }
}

/** What a recording hands back when its author inserts it. */
export type LoomRecording = {
  id: string;
  title: string;
  width: number;
  height: number;
  sharedUrl: string;
};

/** A recorder, ready for one Record press after another. */
export type LoomRecorder = {
  /** Open Loom's recording panel; `onRecorded` hears about the result. */
  record: (onRecorded: (video: LoomRecording) => void) => void;
};

/*
 * One SDK per page and app id. Loom's `setup` mounts its own UI into the
 * page, so a document with three Loom blocks sets it up once and the blocks
 * share it.
 */
const recorders = new Map<string, Promise<LoomRecorder>>();

/** Why recording failed, in words for the person who pressed the button. */
export function explainLoomFailure(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  // What React 19 answers the SDK's `ReactDOM.render`.
  if (/render is not a function|is not a function.*render/i.test(message)) {
    return 'The Loom recorder needs React 18 and this page runs React 19. See the Loom notes in the jupyter-lexical README to give it one.';
  }
  return `Loom could not start recording: ${message}`;
}

/**
 * The recorder for `publicAppId`, set up on first use.
 *
 * Checks the browser first: Loom records in the ones it supports, and says
 * which it does not rather than failing halfway into a recording.
 */
export function loomRecorder(publicAppId: string): Promise<LoomRecorder> {
  let recorder = recorders.get(publicAppId);
  if (!recorder) {
    recorder = (async () => {
      const { isSupported } = await import('@loomhq/record-sdk/is-supported');
      const { supported, error } = await isSupported();
      if (!supported) {
        throw new Error(`this browser cannot record with Loom (${error})`);
      }
      const { setup } = await import('@loomhq/record-sdk');
      /*
       * `setup` warns that it is deprecated for `createInstance`, which
       * authenticates first-party with `{ jws, mode, siteId }` — a token
       * signed by a server holding Loom credentials. A public app id is what
       * a document has, so `setup` is the call it can make.
       */
      const { configureButton } = await setup({ publicAppId });
      const button = configureButton();
      let listener: ((video: LoomRecording) => void) | undefined;
      /*
       * The video goes into the block as soon as the recording ends, not
       * only when its author presses Loom's own "Insert": closing Loom's
       * last dialog instead must not leave the block empty with the video
       * made. Loom has given it its address by then; the player shows it
       * processing until it is ready. The later events say the same, and
       * saying it again changes nothing.
       *
       * Each video's news goes to the block that heard of it first: an upload
       * finishing after another block has pressed Record is still the first
       * block's video.
       */
      const owners = new Map<string, (video: LoomRecording) => void>();
      const show = (video: LoomRecording) => {
        let owner = owners.get(video.id);
        if (!owner && listener) {
          owner = listener;
          owners.set(video.id, owner);
        }
        owner?.(video);
      };
      button.on('recording-complete', show);
      button.on('upload-complete', show);
      button.on('insert-click', show);
      return {
        record: onRecorded => {
          // The block that pressed Record last gets the next video.
          listener = onRecorded;
          button.openPreRecordPanel();
        },
      };
    })();
    // A failed setup is not kept: the next press tries again.
    recorder.catch(() => recorders.delete(publicAppId));
    recorders.set(publicAppId, recorder);
  }
  return recorder;
}
