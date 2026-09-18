/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A video recorded in the page — the screen or the camera — with nothing but
 * the browser.
 *
 * The recording itself never enters the document: it stays in the memory of
 * the page that made it (`utils/videoRecording`), and **is lost when the page
 * reloads**. What the document keeps is the recording's id and whether one
 * was made, so that a block whose recording is gone can say so instead of
 * silently offering to record again. For a video that lasts, there is the
 * Loom block, which saves to the author's Loom account.
 *
 * @module nodes/VideoNode
 */

import type { JSX } from 'react';
import type {
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import VideoComponent from '../components/VideoComponent';
import { newVideoRecordingId } from '../utils/videoRecording';

export type SerializedVideoNode = Spread<
  {
    /** Where this page keeps the recording, while it keeps it. */
    recordingId: string;
    /** A recording was made — and is lost if this page does not hold it. */
    recorded: boolean;
    type: 'video';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

export class VideoNode extends DecoratorBlockNode {
  __recordingId: string;
  __recorded: boolean;

  static getType(): string {
    return 'video';
  }

  static clone(node: VideoNode): VideoNode {
    return new VideoNode(
      node.__recordingId,
      node.__recorded,
      node.__format,
      node.__key,
    );
  }

  static importJSON(serialized: SerializedVideoNode): VideoNode {
    const node = new VideoNode(serialized.recordingId, serialized.recorded);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedVideoNode {
    return {
      ...super.exportJSON(),
      type: 'video',
      version: 1,
      recordingId: this.__recordingId,
      recorded: this.__recorded,
    };
  }

  /** Outside this page there is nothing to show: the video is in its memory. */
  exportDOM(): DOMExportOutput {
    return { element: null };
  }

  constructor(
    recordingId?: string,
    recorded = false,
    format?: ElementFormatType,
    key?: NodeKey,
  ) {
    super(format, key);
    this.__recordingId = recordingId || newVideoRecordingId();
    this.__recorded = recorded;
  }

  getRecordingId(): string {
    return this.getLatest().__recordingId;
  }

  isRecorded(): boolean {
    return this.getLatest().__recorded;
  }

  setRecorded(recorded: boolean): void {
    this.getWritable().__recorded = recorded;
  }

  getTextContent(): string {
    return '';
  }

  updateDOM(): false {
    return false;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    return (
      <VideoComponent
        className={{
          base: embedBlockTheme.base || '',
          focus: embedBlockTheme.focus || '',
        }}
        format={this.__format}
        nodeKey={this.getKey()}
        recordingId={this.__recordingId}
        recorded={this.__recorded}
      />
    );
  }

  isTopLevel(): true {
    return true;
  }
}

/** A video block, ready to record. */
export function $createVideoNode(): VideoNode {
  return new VideoNode();
}

export function $isVideoNode(
  node: LexicalNode | null | undefined,
): node is VideoNode {
  return node instanceof VideoNode;
}
