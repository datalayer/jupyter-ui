/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { ICellProps } from '../components/cell/Cell';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Cell component
 * 
 * This component wraps the Cell component with React.lazy for code splitting.
 * The heavy JupyterLab cell dependencies are only loaded when this component
 * is rendered.
 */
const CellImpl = lazy(() => 
  import('../components/cell/Cell').then(module => ({
    default: module.Cell
  }))
);

export interface ILazyCellProps extends ICellProps {
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
 * Lazy-loaded Cell component with built-in Suspense boundary
 * 
 * This component automatically provides a loading state while the
 * Cell component is being loaded.
 * 
 * @example
 * ```tsx
 * <LazyCell 
 *   source="print('Hello, World!')" 
 *   kernel={kernel}
 *   autoStart={true}
 * />
 * ```
 */
export const LazyCell: React.FC<ILazyCellProps> = ({
  fallback,
  skeletonHeight = '150px',
  ...cellProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton 
      height={skeletonHeight} 
      componentType="cell"
    />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <CellImpl {...cellProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Cell component without Suspense boundary
 * 
 * Use this when you want to manage the Suspense boundary yourself,
 * e.g., when loading multiple components together.
 */
export const LazyCellRaw = CellImpl;

export default LazyCell;
