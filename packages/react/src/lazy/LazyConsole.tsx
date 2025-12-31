/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { Console as ConsoleNamespace } from '../components/console/Console';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Console component
 */
const ConsoleImpl = lazy(() => 
  import('../components/console/Console').then(module => ({
    default: module.Console
  }))
);

export interface ILazyConsoleProps extends ConsoleNamespace.IConsoleOptions {
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
 * Lazy-loaded Console component with built-in Suspense boundary
 * 
 * @example
 * ```tsx
 * <LazyConsole code="print('Hello!')" />
 * ```
 */
export const LazyConsole: React.FC<ILazyConsoleProps> = ({
  fallback,
  skeletonHeight = '300px',
  ...consoleProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton 
      height={skeletonHeight} 
      componentType="console"
    />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <ConsoleImpl {...consoleProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Console component without Suspense boundary
 */
export const LazyConsoleRaw = ConsoleImpl;

export default LazyConsole;
