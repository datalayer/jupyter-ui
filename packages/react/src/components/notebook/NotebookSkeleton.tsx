/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What a notebook looks like before it is there.
 *
 * A spinner says "wait"; a skeleton says "wait, and here is what you are
 * waiting for". The notebook used to show a wheel while its model loaded,
 * another while its panel was built, and then nothing at all while the cells
 * were rendered into the attached widget — a blank the width of the page,
 * after the wheel had said the wait was over. This stands in the shape of
 * the thing instead: cells with their prompt gutters, some with output, and
 * it stays until the cells are actually on screen.
 *
 * Built from Primer's skeleton primitives and nothing else — `SkeletonBox`,
 * `SkeletonText`, `SkeletonAvatar` — so the shimmer, the radius, the colours
 * in both themes and the reduced-motion behaviour are the design system's.
 *
 * **Announced once, not read out.** The bars are decoration: a screen reader
 * that walked them would hear nothing useful many times over. The skeleton is
 * a single `role="status"` labelled with what is coming, and everything
 * inside it is `aria-hidden`.
 *
 * **In the user's colours.** Primer draws every bar with one variable,
 * `--skeletonLoader-bgColor`, and its default is a grey that belongs to no
 * theme of ours — on the ivory ground it read as another application's
 * loader. The region sets that variable from the palette: the text colour
 * of the theme, at a tenth of its strength, which is a bar of the ground's
 * own family in every variant and both modes.
 *
 * @module components/notebook/NotebookSkeleton
 */

import type { CSSProperties, JSX, ReactNode } from 'react';
import {
  SkeletonAvatar,
  SkeletonBox,
  SkeletonText,
} from '@primer/react/experimental';
import { Box, useColorPalette } from '@datalayer/primer-addons';

/**
 * A palette colour at a given opacity.
 *
 * The palette hands out solid hex; a bar that is the theme's text colour at
 * a tenth of its strength needs the same colour with an alpha. Anything
 * that is not hex is returned as it came.
 */
export function withAlpha(color: string, alpha: number): string {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) {
    return color;
  }
  const hex =
    match[1].length === 3
      ? match[1]
          .split('')
          .map(c => c + c)
          .join('')
      : match[1];
  const value = parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** The variable Primer's skeleton primitives paint with. */
export const SKELETON_COLOR_VARIABLE = '--skeletonLoader-bgColor';

/**
 * The bars' colour, from the palette: the theme's text at a tenth of its
 * strength — a little more in the dark, where a tenth is lost on the ground.
 */
export function skeletonColor(palette: {
  textLight: string;
  isLight: boolean;
}): string {
  return withAlpha(palette.textLight, palette.isLight ? 0.1 : 0.18);
}

/** The frame every skeleton shares: one announcement, silent contents. */
export function SkeletonRegion({
  label,
  children,
  sx,
}: {
  label: string;
  children: ReactNode;
  sx?: Record<string, any>;
}): JSX.Element {
  const palette = useColorPalette();
  // As a style, not through `sx`: a custom property is what the bars read,
  // and it inherits, so setting it once on the region colours every bar.
  const style = {
    [SKELETON_COLOR_VARIABLE]: skeletonColor(palette),
  } as CSSProperties;
  return (
    <Box
      role="status"
      aria-label={label}
      aria-busy="true"
      sx={sx}
      style={style}
    >
      <Box aria-hidden="true" sx={{ display: 'grid', gap: 3 }}>
        {children}
      </Box>
    </Box>
  );
}

/**
 * The bar above an editor: what the thing is called, and who is in it.
 *
 * The real header carries a name, a path and the collaborators' faces, so the
 * skeleton carries a wide bar, a narrow one under it, and two avatars. For a
 * host whose editor has such a header; the notebook component itself has
 * none, which is why `NotebookSkeleton` draws it only when asked.
 */
export function EditorHeaderSkeleton(): JSX.Element {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 3,
        p: 3,
        borderBottom: '1px solid',
        borderColor: 'border.muted',
      }}
    >
      <Box
        sx={{ flex: 1, minWidth: 0, maxWidth: 520, display: 'grid', gap: 2 }}
      >
        <SkeletonText size="titleMedium" lines={1} maxWidth="18rem" />
        <SkeletonText size="bodySmall" lines={1} maxWidth="11rem" />
      </Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
      >
        <SkeletonAvatar size={24} />
        <SkeletonAvatar size={24} />
        <SkeletonBox width="72px" height="28px" />
      </Box>
    </Box>
  );
}

/**
 * One cell: the gutter that carries `[ ]`, the source, and sometimes what it
 * printed.
 *
 * `lines` is how tall the source is, so a stack of these can vary the way real
 * cells do — a notebook of identical blocks reads as a loading bar, not as a
 * notebook.
 */
export function CellRowSkeleton({
  lines = 3,
  output,
}: {
  lines?: number;
  output?: boolean;
}): JSX.Element {
  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* The prompt gutter, at the width the real `[ ]` occupies. */}
        <SkeletonBox width="44px" height="20px" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SkeletonBox width="100%" height={`${lines * 20 + 16}px`} />
        </Box>
      </Box>
      {output ? (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
          <Box sx={{ width: 44, flexShrink: 0 }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <SkeletonBox width="82%" height="64px" />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

/**
 * The cells the skeleton draws by default: four, two with output, at
 * different heights — enough for the shape to read as a notebook without
 * pretending to know how long the real one is.
 */
const DEFAULT_CELLS: { lines: number; output?: boolean }[] = [
  { lines: 2 },
  { lines: 4, output: true },
  { lines: 3 },
  { lines: 2, output: true },
];

export interface INotebookSkeletonProps {
  /** What a screen reader is told is coming. */
  label?: string;
  /**
   * Whether to draw the editor header over the cells — for a host whose
   * notebook area starts with a name and its collaborators. The notebook
   * component itself has no such header, so the default is none.
   */
  header?: boolean;
  /** The cells to draw, each by the height of its source. */
  cells?: { lines: number; output?: boolean }[];
  /** How wide the cells run; the notebook's own sheet by default. */
  maxWidth?: number | string;
}

/**
 * A notebook on its way: cells with their gutters, and a header when asked.
 */
export function NotebookSkeleton({
  label = 'Loading the notebook',
  header = false,
  cells = DEFAULT_CELLS,
  maxWidth = 980,
}: INotebookSkeletonProps = {}): JSX.Element {
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
        {cells.map((cell, index) => (
          <CellRowSkeleton
            key={index}
            lines={cell.lines}
            output={cell.output}
          />
        ))}
      </Box>
    </SkeletonRegion>
  );
}

export default NotebookSkeleton;
