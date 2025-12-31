/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { IViewerProps } from '../components/viewer/Viewer';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Viewer component
 */
const ViewerImpl = lazy(() =>
  import('../components/viewer/Viewer').then(module => ({
    default: module.Viewer,
  }))
);

export interface ILazyViewerProps extends IViewerProps {
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
 * Lazy-loaded Viewer component with built-in Suspense boundary
 *
 * @example
 * ```tsx
 * <LazyViewer
 *   nbformat={notebookContent}
 *   outputs={true}
 * />
 * ```
 */
export const LazyViewer: React.FC<ILazyViewerProps> = ({
  fallback,
  skeletonHeight = '300px',
  ...viewerProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton height={skeletonHeight} componentType="viewer" />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <ViewerImpl {...viewerProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Viewer component without Suspense boundary
 */
export const LazyViewerRaw = ViewerImpl;

export default LazyViewer;
