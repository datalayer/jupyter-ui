/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Which notebook semantics a kernel, and the components on it, follow.
 *
 * - `jupyter` — the default: a cell runs when asked, and only that cell.
 * - `marimo` — reactive, as Marimo defines it: running a cell also re-runs
 *   every cell that depends on a name it defines, in dependency order. The
 *   dependency graph is Marimo's own, kept inside the kernel and driven over
 *   the plain Jupyter protocol (see `./marimo/reactive`).
 *
 * @module jupyter/variant
 */
export type JupyterVariant = 'jupyter' | 'marimo';

/** The variant something runs with, `jupyter` when none was said. */
export const DEFAULT_VARIANT: JupyterVariant = 'jupyter';

/** Whether a variant re-runs dependents on its own. */
export const isReactiveVariant = (variant?: JupyterVariant): boolean =>
  variant === 'marimo';
