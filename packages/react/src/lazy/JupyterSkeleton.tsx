/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React from 'react';
import { Spinner } from '@primer/react';
import { Box } from '@datalayer/primer-addons';

export interface IJupyterSkeletonProps {
  /**
   * Height of the skeleton loader
   */
  height?: string | number;
  /**
   * Whether to show the "Loading..." text
   */
  showText?: boolean;
  /**
   * Custom loading text
   */
  text?: string;
  /**
   * Component type being loaded (for accessibility)
   */
  componentType?:
    | 'cell'
    | 'notebook'
    | 'terminal'
    | 'console'
    | 'output'
    | 'viewer';
}

/**
 * Skeleton loading component for lazy-loaded Jupyter components.
 *
 * Use this as a fallback in Suspense boundaries when lazy-loading
 * heavy Jupyter components.
 */
export const JupyterSkeleton: React.FC<IJupyterSkeletonProps> = ({
  height = '200px',
  showText = true,
  text,
  componentType,
}) => {
  const displayText =
    text ??
    (componentType
      ? `Loading Jupyter ${componentType}...`
      : 'Loading Jupyter component...');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height,
        gap: 3,
        backgroundColor: 'canvas.subtle',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'border.muted',
      }}
      role="status"
      aria-label={displayText}
    >
      <Spinner size="large" />
      {showText && (
        <Box
          sx={{
            color: 'fg.muted',
            fontSize: 1,
          }}
        >
          {displayText}
        </Box>
      )}
    </Box>
  );
};

export default JupyterSkeleton;
