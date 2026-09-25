/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Videos recorded in the page, as a Lexical extension.
 *
 * Registers `VideoNode` and answers `INSERT_VIDEO_COMMAND` with a block
 * ready to record the screen or the camera. The recording stays in the
 * page's memory and is lost on reload; see `utils/videoRecording`.
 *
 * A block deleted while it records stops the recording — the camera or the
 * screen share would otherwise run on with nothing to show it. What was
 * recorded is kept, so an undo brings the block back with its video.
 *
 * @module extensions/VideoExtension
 */

import { $insertNodeToNearestRoot, mergeRegister } from '@lexical/utils';
import {
  $getNodeByKey,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  defineExtension,
  type LexicalCommand,
  type LexicalEditor,
} from 'lexical';
import { $createVideoNode, $isVideoNode, VideoNode } from '../nodes/VideoNode';
import { stopVideoRecording } from '../utils/videoRecording';

/** Insert a video block, ready to record. */
export const INSERT_VIDEO_COMMAND: LexicalCommand<void> = createCommand(
  'INSERT_VIDEO_COMMAND',
);

/**
 * Handle `INSERT_VIDEO_COMMAND` on `editor`, and stop the recording of a
 * block that goes away.
 *
 * @returns The function that removes both again.
 */
export function registerVideo(editor: LexicalEditor): () => void {
  if (!editor.hasNodes([VideoNode])) {
    throw new Error('VideoExtension: VideoNode not registered on editor');
  }
  return mergeRegister(
    editor.registerCommand(
      INSERT_VIDEO_COMMAND,
      () => {
        $insertNodeToNearestRoot($createVideoNode());
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerMutationListener(
      VideoNode,
      (mutations, { prevEditorState }) => {
        for (const [key, mutation] of mutations) {
          if (mutation !== 'destroyed') {
            continue;
          }
          const recordingId = prevEditorState.read(() => {
            const node = $getNodeByKey(key);
            return $isVideoNode(node) ? node.__recordingId : undefined;
          });
          if (recordingId) {
            stopVideoRecording(recordingId);
          }
        }
      },
      { skipInitialization: true },
    ),
  );
}

export const VideoExtension = defineExtension({
  name: '@datalayer/jupyter-lexical/Video',
  nodes: () => [VideoNode],
  register: registerVideo,
});
