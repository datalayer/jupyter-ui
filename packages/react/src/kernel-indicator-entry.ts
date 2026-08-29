/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * The kernel indicator, and nothing else.
 *
 * The `./kernel-indicator` subpath used to point at the kernel folder's barrel,
 * which re-exports the launcher, the inspector, the logs and the selector —
 * and through them Lumino and JupyterLab's widget layer. A caller that wanted
 * one status light got the lot: a plugin's entry module pulled `@lumino/domutils`,
 * which touches `document` when it loads, and any host importing that plugin
 * outside a browser broke on it.
 *
 * So the subpath names an entry of its own. The indicator needs
 * `@jupyterlab/services` and Primer; everything heavier stays behind the
 * `./kernel` barrel for callers that actually want it.
 *
 * @module kernel-indicator-entry
 */

export {
  KernelIndicator,
  type KernelIndicatorProps,
  type KernelIndicatorPosition,
} from './components/kernel/KernelIndicator';
export {
  KERNEL_STATE_LABELS,
  KERNEL_STATE_VISUALS,
  KERNEL_STATES,
  renderKernelStateGlyph,
  toKernelState,
  type ExecutionState,
  type KernelIndicatorMeta,
  type KernelIndicatorMetaInput,
} from './components/kernel/KernelIndicatorState';
