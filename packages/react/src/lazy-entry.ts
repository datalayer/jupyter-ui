/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Lazy entry point - code-split components
 * 
 * This entry point provides React.lazy wrapped components that enable
 * proper code splitting. Each component is loaded on-demand when first
 * rendered.
 * 
 * Use with the core entry point for optimal bundle size:
 * 
 * @example
 * ```tsx
 * import { JupyterReactTheme } from '@datalayer/jupyter-react/core';
 * import { LazyCell, LazyNotebook, JupyterSkeleton } from '@datalayer/jupyter-react/lazy';
 * 
 * function App() {
 *   return (
 *     <JupyterReactTheme>
 *       <LazyCell source="print('Hello!')" />
 *       <LazyNotebook id="nb" serviceManager={sm} />
 *     </JupyterReactTheme>
 *   );
 * }
 * ```
 */

// Lazy-loaded components with built-in Suspense
export { LazyCell, LazyCellRaw } from './lazy/LazyCell';
export { LazyNotebook, LazyNotebookRaw } from './lazy/LazyNotebook';
export { LazyOutput, LazyOutputRaw } from './lazy/LazyOutput';
export { LazyTerminal, LazyTerminalRaw } from './lazy/LazyTerminal';
export { LazyConsole, LazyConsoleRaw } from './lazy/LazyConsole';
export { LazyViewer, LazyViewerRaw } from './lazy/LazyViewer';

// Skeleton loader for custom Suspense boundaries
export { JupyterSkeleton, type IJupyterSkeletonProps } from './lazy/JupyterSkeleton';

// Re-export types for convenience (types don't add bundle size)
export type { ILazyCellProps } from './lazy/LazyCell';
export type { ILazyNotebookProps } from './lazy/LazyNotebook';
export type { ILazyOutputProps } from './lazy/LazyOutput';
export type { ILazyTerminalProps } from './lazy/LazyTerminal';
export type { ILazyConsoleProps } from './lazy/LazyConsole';
export type { ILazyViewerProps } from './lazy/LazyViewer';
