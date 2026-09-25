/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What a document looks like before it is there.
 *
 * Prose rather than cells: a title, then paragraphs, and the paragraphs are
 * deliberately uneven — a document whose every block is the same width
 * reads as a table. A host shows it while the editor state is fetched; the
 * layout does not move when the real thing replaces the drawing of it.
 *
 * The header is the editor's twin in `@datalayer/jupyter-react`, so a
 * document and a notebook arriving side by side look like one application
 * waiting rather than two.
 *
 * Built from Primer's skeleton primitives, announced once as a single
 * `role="status"`, its bars `aria-hidden` — the same rules as the notebook
 * skeleton, for the same reasons.
 *
 * @module components/DocumentSkeleton
 */

import type { JSX } from 'react';
import { SkeletonBox, SkeletonText } from '@primer/react/experimental';
import { Box } from '@datalayer/primer-addons';
import { EditorHeaderSkeleton, SkeletonRegion } from '@datalayer/jupyter-react';

export interface IDocumentSkeletonProps {
  /** What a screen reader is told is coming. */
  label?: string;
  /**
   * Whether to draw the editor header over the prose — for a host whose
   * document area starts with a name and its collaborators.
   */
  header?: boolean;
  /** How wide the prose runs; a reading measure by default. */
  maxWidth?: number | string;
}

/**
 * A document on its way: a title, then paragraphs, and a header when asked.
 */
export function DocumentSkeleton({
  label = 'Loading the document',
  header = false,
  maxWidth = 760,
}: IDocumentSkeletonProps = {}): JSX.Element {
  return (
    <SkeletonRegion
      label={label}
      sx={{ flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}
    >
      {header ? <EditorHeaderSkeleton /> : null}
      <Box
        sx={{
          px: 4,
          py: header ? 0 : 4,
          pb: 4,
          display: 'grid',
          gap: 4,
          maxWidth,
          mx: 'auto',
          width: '100%',
        }}
      >
        <SkeletonText size="titleLarge" lines={1} maxWidth="22rem" />
        <SkeletonText size="bodyMedium" lines={3} />
        <SkeletonText size="bodyMedium" lines={4} maxWidth="92%" />
        {/* A figure or a quote: prose of any length has one somewhere. */}
        <SkeletonBox width="100%" height="120px" />
        <SkeletonText size="bodyMedium" lines={3} maxWidth="88%" />
      </Box>
    </SkeletonRegion>
  );
}

export default DocumentSkeleton;
