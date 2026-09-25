/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A video block, drawn: the recorder, the recording in progress, the
 * recording made — or, after a reload, the news that it is gone.
 *
 * Every state says the one thing a reader of this block must know: the video
 * lives in this page's memory and nowhere else.
 *
 * @module components/VideoComponent
 */

import type { JSX, SyntheticEvent } from 'react';
import type { ElementFormatType, NodeKey } from 'lexical';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  SegmentedControl,
  Text,
} from '@primer/react';
import {
  DeviceCameraVideoIcon,
  DownloadIcon,
  SquareFillIcon,
} from '@primer/octicons-react';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalEditable } from '@lexical/react/useLexicalEditable';
import { $getNodeByKey, $setSelection } from 'lexical';
// A cycle, and a harmless one: the node draws with this component, and this
// only reaches for the node when a recording is made or dropped.
import { $isVideoNode } from '../nodes/VideoNode';
import {
  canRecordVideo,
  discardVideoRecording,
  startVideoRecording,
  stopVideoRecording,
  subscribeVideoRecordings,
  videoBlockStatus,
  videoFileName,
  videoRecordingOf,
  type VideoRecording,
  type VideoSource,
} from '../utils/videoRecording';

type VideoComponentProps = Readonly<{
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  recordingId: string;
  recorded: boolean;
}>;

const MEMORY_ONLY =
  'Kept in this page’s memory only: it is lost when the page reloads, and nobody else sees it. Download it to keep it.';

const frame = {
  position: 'relative',
  width: '100%',
  aspectRatio: '16 / 9',
  borderRadius: 2,
  overflow: 'hidden',
  bg: 'black',
} as const;

/** `m:ss` */
function clock(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/**
 * A recorded WebM says nothing of its length, so the player shows no
 * duration and cannot seek. Asking it for a moment far past the end makes it
 * find out; then back to the start.
 */
function learnDuration(event: SyntheticEvent<HTMLVideoElement>): void {
  const video = event.currentTarget;
  if (Number.isFinite(video.duration)) {
    return;
  }
  const rewind = () => {
    video.removeEventListener('timeupdate', rewind);
    video.currentTime = 0;
  };
  video.addEventListener('timeupdate', rewind);
  video.currentTime = Number.MAX_SAFE_INTEGER;
}

/** What is being recorded, live, with the time and the way to stop. */
function Recording({
  recordingId,
  recording,
}: {
  recordingId: string;
  recording: Extract<VideoRecording, { status: 'recording' }>;
}): JSX.Element {
  const preview = useRef<HTMLVideoElement | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (preview.current) {
      preview.current.srcObject = recording.preview;
    }
  }, [recording.preview]);
  useEffect(() => {
    const tick = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(tick);
  }, []);
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={frame}>
        <video
          ref={preview}
          autoPlay
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          aria-hidden
          sx={{ width: 10, height: 10, borderRadius: '50%', bg: 'danger.fg' }}
        />
        <Text sx={{ fontFamily: 'mono' }} aria-live="off">
          {clock(now - recording.startedAt)}
        </Text>
        <Button
          variant="danger"
          leadingVisual={SquareFillIcon}
          onClick={() => stopVideoRecording(recordingId)}
          sx={{ ml: 'auto' }}
        >
          Stop
        </Button>
      </Box>
    </Box>
  );
}

export default function VideoComponent({
  className,
  format,
  nodeKey,
  recordingId,
  recorded,
}: VideoComponentProps): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const isEditable = useLexicalEditable();
  const recording = useSyncExternalStore(subscribeVideoRecordings, () =>
    videoRecordingOf(recordingId),
  );
  const status = videoBlockStatus(recorded, recording);
  const [source, setSource] = useState<VideoSource>('screen');
  const [microphone, setMicrophone] = useState(true);

  const markRecorded = useCallback(
    (value: boolean) => {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if ($isVideoNode(node)) {
          node.setRecorded(value);
        }
      });
    },
    [editor, nodeKey],
  );

  // Called from the click itself: the screen picker needs its permission.
  const record = () =>
    void startVideoRecording(recordingId, { source, microphone }, () =>
      markRecorded(true),
    );

  const recordAgain = () => {
    discardVideoRecording(recordingId);
    markRecorded(false);
  };

  const download = (made: Extract<VideoRecording, { status: 'recorded' }>) => {
    const link = document.createElement('a');
    link.href = made.url;
    link.download = videoFileName(made);
    link.click();
  };

  let body: JSX.Element;
  if (recording?.status === 'recording') {
    body = <Recording recordingId={recordingId} recording={recording} />;
  } else if (recording?.status === 'recorded') {
    body = (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={frame}>
          <video
            src={recording.url}
            controls
            playsInline
            onLoadedMetadata={learnDuration}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Text sx={{ color: 'fg.muted', fontSize: 0, flex: '1 1 240px' }}>
            {MEMORY_ONLY}
          </Text>
          <Button
            leadingVisual={DownloadIcon}
            onClick={() => download(recording)}
          >
            Download
          </Button>
          {isEditable && <Button onClick={recordAgain}>Record again</Button>}
        </Box>
      </Box>
    );
  } else if (status === 'lost') {
    body = (
      <Box sx={{ display: 'grid', gap: 2, justifyItems: 'start' }}>
        <Text sx={{ color: 'fg.muted', fontSize: 1 }}>
          The video recorded here is gone: it was kept in the memory of the page
          that recorded it, and that page has been reloaded or closed.
        </Text>
        {isEditable && (
          <Button onClick={() => markRecorded(false)}>Record a new one</Button>
        )}
      </Box>
    );
  } else if (!isEditable) {
    body = (
      <Text as="p" sx={{ color: 'fg.muted', fontSize: 1, m: 0 }}>
        A video goes here.
      </Text>
    );
  } else {
    body = (
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DeviceCameraVideoIcon size={16} />
          <Text sx={{ fontWeight: 'bold' }}>Video</Text>
        </Box>
        <Text sx={{ color: 'fg.muted', fontSize: 0 }}>
          Recorded by this browser, with no account. {MEMORY_ONLY}
        </Text>
        {canRecordVideo() ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <SegmentedControl aria-label="What to record" size="small">
              <SegmentedControl.Button
                selected={source === 'screen'}
                onClick={() => setSource('screen')}
              >
                Screen
              </SegmentedControl.Button>
              <SegmentedControl.Button
                selected={source === 'camera'}
                onClick={() => setSource('camera')}
              >
                Camera
              </SegmentedControl.Button>
            </SegmentedControl>
            <FormControl>
              <Checkbox
                checked={microphone}
                onChange={event => setMicrophone(event.target.checked)}
              />
              <FormControl.Label>Microphone</FormControl.Label>
            </FormControl>
            <Button variant="primary" onClick={record}>
              Record
            </Button>
          </Box>
        ) : (
          <Text sx={{ color: 'danger.fg', fontSize: 1 }}>
            This browser cannot record video.
          </Text>
        )}
        {recording?.status === 'failed' && (
          <Text role="alert" sx={{ color: 'danger.fg', fontSize: 1 }}>
            {recording.message}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <Box
        data-lexical-video={status}
        /*
         * The editor leaves the controls of a block their own keys — unless
         * the block itself is selected, when Backspace means "delete this
         * block". A control taking focus lets go of that selection.
         */
        onFocusCapture={() => editor.update(() => $setSelection(null))}
        sx={{
          p: status === 'recorded' || status === 'recording' ? 0 : 3,
          border: '1px dashed',
          borderColor:
            status === 'recorded' || status === 'recording'
              ? 'transparent'
              : 'border.default',
          borderRadius: 2,
          bg:
            status === 'recorded' || status === 'recording'
              ? 'transparent'
              : 'canvas.subtle',
        }}
      >
        {body}
      </Box>
    </BlockWithAlignableContents>
  );
}
