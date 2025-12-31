/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Core entry point - lightweight providers and utilities
 * 
 * This entry point contains only the minimal code needed to bootstrap
 * a Jupyter React application:
 * - Theme provider (JupyterReactTheme)
 * - Context and hooks (useJupyter)
 * - State management
 * - Kernel management (without heavy cell/notebook implementations)
 * 
 * Import heavy components from the lazy entry point:
 *   import { LazyCell, LazyNotebook } from '@datalayer/jupyter-react/lazy';
 * 
 * @example
 * ```tsx
 * import { JupyterReactTheme, useJupyter } from '@datalayer/jupyter-react/core';
 * import { LazyCell } from '@datalayer/jupyter-react/lazy';
 * 
 * function App() {
 *   return (
 *     <JupyterReactTheme>
 *       <MyComponents />
 *     </JupyterReactTheme>
 *   );
 * }
 * ```
 */

// Theme - essential for all components
export {
  JupyterReactTheme,
  useJupyterReactColormode,
  type IJupyterLabThemeProps,
} from './theme/JupyterReactTheme';

export type { Colormode } from './theme/JupyterLabColormode';

export { jupyterLabTheme } from './theme/themes';

// Jupyter context and hooks - needed for kernel connection
export {
  useJupyter,
  type IJupyterProps,
  type IJupyterContext,
} from './jupyter/JupyterUse';

export {
  loadJupyterConfig,
  type IJupyterConfig,
} from './jupyter/JupyterConfig';

// Kernel management - lightweight kernel handling
export { Kernel } from './jupyter/kernel/Kernel';

export { useKernelsStore } from './jupyter/kernel/KernelState';

// State management - for advanced usage
export {
  useJupyterReactStore,
  useJupyterReactStoreFromProps,
} from './state/JupyterReactState';

// Lite kernel support
export type { Lite } from './jupyter/lite/Lite';

// Skeleton loader for lazy components
export {
  JupyterSkeleton,
  type IJupyterSkeletonProps,
} from './lazy/JupyterSkeleton';

// Utilities
export { newUuid } from './utils/Utils';
