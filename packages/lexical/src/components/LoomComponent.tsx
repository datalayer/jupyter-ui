/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A Loom block, drawn: the video when there is one, and otherwise the two
 * ways of getting one — record it here, or give the address of one made
 * elsewhere.
 *
 * @module components/LoomComponent
 */

import type { JSX } from 'react';
import type { ElementFormatType, NodeKey } from 'lexical';
import { useCallback, useState } from 'react';
import { Box, Button, Text, TextInput } from '@primer/react';
import { AlertIcon, VideoIcon } from '@primer/octicons-react';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { getPeerDependencyFromEditor } from '@lexical/extension';
import { $getNodeByKey, $setSelection } from 'lexical';
import type { LoomExtension } from '../extensions/LoomExtension';
// A cycle, and a harmless one: the node draws with this component, and this
// only reaches for the node when somebody records or embeds.
import { $isLoomNode } from '../nodes/LoomNode';
import {
  LOOM_EXTENSION_NAME,
  describeLoomVideo,
  explainLoomFailure,
  loomEmbedUrl,
  loomPublicAppIdOf,
  loomRecorder,
  loomVideoId,
  type LoomVideoData,
} from '../utils/loom';

type LoomComponentProps = Readonly<{
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  video: LoomVideoData;
}>;

/** Loom's player, as wide as the column and in the recording's shape. */
function LoomPlayer({ video }: { video: LoomVideoData }): JSX.Element | null {
  const id = loomVideoId(video.url);
  if (!id) {
    return null;
  }
  return (
    <div
      data-lexical-loom-player={id}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${video.width || 16} / ${video.height || 9}`,
        borderRadius: 6,
        overflow: 'hidden',
        background: 'var(--bgColor-muted, #f6f8fa)',
      }}
    >
      <iframe
        src={loomEmbedUrl(id)}
        title={video.title || 'Loom video'}
        allow="fullscreen; picture-in-picture"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          border: 0,
        }}
      />
    </div>
  );
}

/** An empty block: record a video, or give the address of one. */
function LoomPlaceholder({ nodeKey }: { nodeKey: NodeKey }): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState<'recording' | 'embedding' | undefined>();
  const [problem, setProblem] = useState<string | undefined>();

  // The host gives it: as `LoomExtension`'s config, read by name, or to
  // `LoomPlugin` in an editor built with `LexicalComposer`.
  const publicAppId =
    getPeerDependencyFromEditor<typeof LoomExtension>(
      editor,
      LOOM_EXTENSION_NAME,
    )?.config.publicAppId ?? loomPublicAppIdOf(editor);

  const show = useCallback(
    (video: LoomVideoData) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isLoomNode(node)) {
          node.setVideo(video);
        }
      });
    },
    [editor, nodeKey],
  );

  const record = useCallback(async () => {
    if (!publicAppId) {
      return;
    }
    setProblem(undefined);
    setBusy('recording');
    try {
      const recorder = await loomRecorder(publicAppId);
      recorder.record(video =>
        show({
          url: video.sharedUrl,
          title: video.title,
          width: video.width,
          height: video.height,
        }),
      );
    } catch (error) {
      setProblem(explainLoomFailure(error));
    } finally {
      setBusy(undefined);
    }
  }, [publicAppId, show]);

  const embed = useCallback(async () => {
    if (!loomVideoId(address)) {
      setProblem(
        'That is not the address of a Loom video: it looks like https://www.loom.com/share/…',
      );
      return;
    }
    setProblem(undefined);
    setBusy('embedding');
    try {
      show(await describeLoomVideo(address));
    } finally {
      setBusy(undefined);
    }
  }, [address, show]);

  if (!isEditable) {
    return (
      <Text as="p" sx={{ color: 'fg.muted', fontSize: 1, m: 0 }}>
        A Loom video goes here.
      </Text>
    );
  }

  return (
    <Box
      data-lexical-loom-placeholder=""
      sx={{
        display: 'grid',
        gap: 2,
        p: 3,
        border: '1px dashed',
        borderColor: 'border.default',
        borderRadius: 2,
        bg: 'canvas.subtle',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <VideoIcon size={16} />
        <Text sx={{ fontWeight: 'bold' }}>Loom Video</Text>
      </Box>
      <Text sx={{ color: 'fg.muted', fontSize: 0 }}>
        Recorded with Loom: Loom asks you to sign in to your Loom account, and
        the video is saved there, so it stays in the document.
      </Text>
      <Box
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}
      >
        <Button
          variant="primary"
          onClick={() => void record()}
          disabled={!publicAppId || busy !== undefined}
        >
          {busy === 'recording' ? 'Starting…' : 'Record'}
        </Button>
        <Text sx={{ color: 'fg.muted', fontSize: 1 }}>or</Text>
        <TextInput
          aria-label="Address of a Loom video"
          placeholder="https://www.loom.com/share/…"
          value={address}
          onChange={event => setAddress(event.target.value)}
          /*
           * The editor leaves a field inside a block its own keys — unless
           * the block itself is selected, when Backspace means "delete this
           * block". Clicking the block's edge and then the field would leave
           * it so; the field taking focus lets go of that selection.
           */
          onFocus={() => editor.update(() => $setSelection(null))}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void embed();
            }
          }}
          sx={{ flex: '1 1 240px' }}
        />
        <Button
          onClick={() => void embed()}
          disabled={!address.trim() || busy !== undefined}
        >
          {busy === 'embedding' ? 'Embedding…' : 'Embed'}
        </Button>
      </Box>
      {!publicAppId && (
        <Box
          data-lexical-loom-no-app-id=""
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'flex-start',
            color: 'attention.fg',
            fontSize: 1,
          }}
        >
          <AlertIcon size={16} />
          <Text>
            Recording with Loom is off in this editor: it was given no Loom
            public app id, and without one Loom cannot open to let you sign in.
            Its host passes the id to <code>LoomExtension</code>. A Loom video
            can still be embedded by its address.
          </Text>
        </Box>
      )}
      {problem && (
        <Text role="alert" sx={{ color: 'danger.fg', fontSize: 1 }}>
          {problem}
        </Text>
      )}
    </Box>
  );
}

export default function LoomComponent({
  className,
  format,
  nodeKey,
  video,
}: LoomComponentProps): JSX.Element {
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      {loomVideoId(video.url) ? (
        <LoomPlayer video={video} />
      ) : (
        <LoomPlaceholder nodeKey={nodeKey} />
      )}
    </BlockWithAlignableContents>
  );
}
