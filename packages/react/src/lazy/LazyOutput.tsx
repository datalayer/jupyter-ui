/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { IOutputProps } from '../components/output/Output';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Output component
 */
const OutputImpl = lazy(() =>
  import('../components/output/Output').then(module => ({
    default: module.Output,
  }))
);

export interface ILazyOutputProps extends IOutputProps {
  /**
   * Custom fallback component while loading
   */
  fallback?: React.ReactNode;
  /**
   * Height of the skeleton loader
   */
  skeletonHeight?: string;
}

/**
 * Lazy-loaded Output component with built-in Suspense boundary
 *
 * @example
 * ```tsx
 * <LazyOutput
 *   code="print('Hello!')"
 *   kernel={kernel}
 *   autoRun={true}
 * />
 * ```
 */
export const LazyOutput: React.FC<ILazyOutputProps> = ({
  fallback,
  skeletonHeight = '100px',
  ...outputProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton height={skeletonHeight} componentType="output" />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <OutputImpl {...outputProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Output component without Suspense boundary
 */
export const LazyOutputRaw = OutputImpl;

export default LazyOutput;
