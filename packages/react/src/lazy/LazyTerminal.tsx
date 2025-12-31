/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import React, { lazy, Suspense } from 'react';
import type { Terminal as TerminalNamespace } from '../components/terminal/Terminal';
import { JupyterSkeleton } from './JupyterSkeleton';

/**
 * Lazy-loaded Terminal component
 */
const TerminalImpl = lazy(() =>
  import('../components/terminal/Terminal').then(module => ({
    default: module.Terminal,
  }))
);

export interface ILazyTerminalProps extends TerminalNamespace.ITerminalOptions {
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
 * Lazy-loaded Terminal component with built-in Suspense boundary
 *
 * @example
 * ```tsx
 * <LazyTerminal
 *   height="400px"
 *   colormode="dark"
 * />
 * ```
 */
export const LazyTerminal: React.FC<ILazyTerminalProps> = ({
  fallback,
  skeletonHeight = '300px',
  ...terminalProps
}) => {
  const defaultFallback = (
    <JupyterSkeleton height={skeletonHeight} componentType="terminal" />
  );

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      <TerminalImpl {...terminalProps} />
    </Suspense>
  );
};

/**
 * Raw lazy Terminal component without Suspense boundary
 */
export const LazyTerminalRaw = TerminalImpl;

export default LazyTerminal;
