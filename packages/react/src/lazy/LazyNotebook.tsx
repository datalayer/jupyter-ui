/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { INotebookProps } from '../components/notebook/Notebook';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Notebook component
 */
const NotebookImpl = lazy(() => 
  import('../components/notebook/Notebook').then(module => ({
    default: module.Notebook
  }))
);

export interface ILazyNotebookProps extends INotebookProps {
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
 * Lazy-loaded Notebook component with built-in Suspense boundary
 * 
 * @example
 * ```tsx
 * <LazyNotebook 
 *   id="my-notebook"
 *   serviceManager={serviceManager}
 *   nbformat={notebookContent}
 * />
 * ```
 */
export const LazyNotebook: React.FC<React.PropsWithChildren<ILazyNotebookProps>> = ({
  fallback,
  skeletonHeight = '400px',
  ...notebookProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton 
      height={skeletonHeight} 
      componentType="notebook"
    />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <NotebookImpl {...notebookProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Notebook component without Suspense boundary
 */
export const LazyNotebookRaw = NotebookImpl;

export default LazyNotebook;
