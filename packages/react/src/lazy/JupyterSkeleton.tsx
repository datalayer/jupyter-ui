/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { SkeletonBox } from '@primer/react/experimental';
import { Box } from '@datalayer/primer-addons';
import {
  CellRowSkeleton,
  NotebookSkeleton,
  SkeletonRegion,
} from '../components/notebook/NotebookSkeleton';

export interface IJupyterSkeletonProps {
  /**
   * Height of the skeleton loader
   */
  height?: string | number;
  /**
   * Custom accessible label; derived from the component type when absent.
   */
  text?: string;
  /**
   * Component type being loaded: chooses the shape drawn.
   */
  componentType?:
    'cell' | 'notebook' | 'terminal' | 'console' | 'output' | 'viewer';
}

/**
 * Skeleton loading component for lazy-loaded Jupyter components.
 *
 * Use this as a fallback in Suspense boundaries when lazy-loading heavy
 * Jupyter components. It draws the shape of what is coming rather than a
 * wheel: a notebook is cells with gutters, a cell is one such row, and the
 * rest — a terminal, a console, an output, a viewer — are one block at the
 * height the component will take, so the layout does not move when the real
 * thing arrives.
 */
export const JupyterSkeleton: React.FC<IJupyterSkeletonProps> = ({
  height = '200px',
  text,
  componentType,
}) => {
  const label =
    text ??
    (componentType
      ? `Loading the Jupyter ${componentType}`
      : 'Loading the Jupyter component');

  if (componentType === 'notebook') {
    return (
      <Box sx={{ height, overflow: 'hidden' }}>
        <NotebookSkeleton label={label} />
      </Box>
    );
  }
  if (componentType === 'cell') {
    return (
      <SkeletonRegion label={label} sx={{ width: '100%', py: 3 }}>
        <CellRowSkeleton lines={4} output />
      </SkeletonRegion>
    );
  }
  return (
    <SkeletonRegion label={label} sx={{ width: '100%' }}>
      <SkeletonBox
        width="100%"
        height={typeof height === 'number' ? `${height}px` : height}
      />
    </SkeletonRegion>
  );
};

export default JupyterSkeleton;
