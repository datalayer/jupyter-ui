/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lazy-loaded components for code splitting
 *
 * This module provides React.lazy wrappers around heavy Jupyter components.
 * Use these when you want to enable proper code splitting and reduce initial
 * bundle size.
 *
 * Usage:
 *   import { LazyCell, LazyNotebook } from '@datalayer/jupyter-react/lazy';
 *
 *   <Suspense fallback={<JupyterSkeleton />}>
 *     <LazyCell source="print('hello')" />
 *   </Suspense>
 */

export * from './LazyCell';
export * from './LazyNotebook';
export * from './LazyOutput';
export * from './LazyTerminal';
export * from './LazyConsole';
export * from './LazyViewer';
export * from './JupyterSkeleton';
