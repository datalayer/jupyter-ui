/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2025 Datalayer, Inc.
 *
 * MIT License
 */

import type {
  EditorConfig,
  ElementFormatType,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import { useEffect, useState } from 'react';
import { useEmbedHandlers } from '../context/EmbedHandlersContext';

type YouTubeComponentProps = Readonly<{
  className: Readonly<{
    base: string;
    focus: string;
  }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  videoID: string;
}>;

/**
 * YouTube thumbnail component with play button overlay.
 * Used when a custom click handler is provided via context.
 */
function YouTubeThumbnailComponent({
  videoID,
  onClick,
}: {
  videoID: string;
  onClick: () => void;
}) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    `https://img.youtube.com/vi/${videoID}/maxresdefault.jpg`,
  );

  // Fallback to mqdefault if maxresdefault doesn't exist
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      // Check if we got the default thumbnail (120x90)
      if (img.width === 120 && img.height === 90) {
        setThumbnailUrl(`https://img.youtube.com/vi/${videoID}/mqdefault.jpg`);
      }
    };
    img.src = thumbnailUrl;
  }, [videoID, thumbnailUrl]);

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        width: '560px',
        height: '315px',
        cursor: 'pointer',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img
        src={thumbnailUrl}
        alt="YouTube video thumbnail"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {/* Play button overlay */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '68px',
          height: '48px',
          backgroundColor: 'rgba(255, 0, 0, 0.8)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 1)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        }}
      >
        {/* Play triangle */}
        <div
          style={{
            width: 0,
            height: 0,
            borderLeft: '20px solid white',
            borderTop: '12px solid transparent',
            borderBottom: '12px solid transparent',
            marginLeft: '4px',
          }}
        />
      </div>
    </div>
  );
}

function YouTubeComponent({
  className,
  format,
  nodeKey,
  videoID,
}: YouTubeComponentProps) {
  const { onYouTubeClick } = useEmbedHandlers();

  // If a custom handler is provided, use thumbnail + handler
  if (onYouTubeClick) {
    return (
      <BlockWithAlignableContents
        className={className}
        format={format}
        nodeKey={nodeKey}
      >
        <YouTubeThumbnailComponent
          videoID={videoID}
          onClick={() => onYouTubeClick(videoID)}
        />
      </BlockWithAlignableContents>
    );
  }

  // Default: standard iframe embed
  return (
    <BlockWithAlignableContents
      className={className}
      format={format}
      nodeKey={nodeKey}
    >
      <iframe
        width="560"
        height="315"
        src={`https://www.youtube.com/embed/${videoID}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="YouTube video"
      />
    </BlockWithAlignableContents>
  );
}

export type SerializedYouTubeNode = Spread<
  {
    videoID: string;
    type: 'youtube';
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

export class YouTubeNode extends DecoratorBlockNode {
  __id: string;

  static getType(): string {
    return 'youtube';
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__id, node.__format, node.__key);
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    const node = $createYouTubeNode(serializedNode.videoID);
    node.setFormat(serializedNode.format);
    return node;
  }

  exportJSON(): SerializedYouTubeNode {
    return {
      ...super.exportJSON(),
      type: 'youtube',
      version: 1,
      videoID: this.__id,
    };
  }

  constructor(id: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__id = id;
  }

  updateDOM(): false {
    return false;
  }

  getId(): string {
    return this.__id;
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const embedBlockTheme = config.theme.embedBlock || {};
    const className = {
      base: embedBlockTheme.base || '',
      focus: embedBlockTheme.focus || '',
    };
    return (
      <YouTubeComponent
        className={className}
        format={this.__format}
        nodeKey={this.getKey()}
        videoID={this.__id}
      />
    );
  }

  isTopLevel(): true {
    return true;
  }
}

export function $createYouTubeNode(videoID: string): YouTubeNode {
  return new YouTubeNode(videoID);
}

export function $isYouTubeNode(
  node: YouTubeNode | LexicalNode | null | undefined,
): node is YouTubeNode {
  return node instanceof YouTubeNode;
}
