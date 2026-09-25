/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What the marimo runtime bundle (`marimo/build.mjs` → `src/marimo/bundle/index.js`)
 * exports. Kept by hand: the bundle is marimo's app, whose types do not build
 * outside marimo's own tree.
 */

/** A comm opened on the kernel: what the bridge sends and hears. */
export interface KernelComm {
  send(data: Record<string, unknown>): void;
  onMessage(handler: (data: Record<string, unknown>) => void): void;
  onClose(handler: () => void): void;
  close(): void;
}

/** What the marimo bridge needs from a Jupyter kernel connection. */
export interface KernelPort {
  /** Run code in the kernel, silently; resolves when done, rejects on an error. */
  execute(code: string): Promise<void>;
  /** Open a comm on a target the kernel registered. */
  openComm(target: string): Promise<KernelComm>;
  /** Interrupt the kernel. */
  interrupt(): Promise<void>;
}

/** How a marimo notebook is opened on the kernel. */
export interface MarimoSessionOptions {
  /** The notebook's path on the kernel's filesystem. */
  filename?: string | null;
  /** The notebook's source; written to `filename` when given. */
  code?: string | null;
  /** Query parameters the notebook reads with `mo.query_params()`. */
  queryParams?: Record<string, string | string[]>;
}

/** marimo's mount options; the ones this integration uses. */
export interface MarimoMountOptions {
  /** The notebook's filename. */
  filename?: string | null;
  /** The notebook's source, a marimo `.py` file. */
  code?: string | null;
  /** `edit` shows the cells and their editors; `read` the app view. */
  mode: 'edit' | 'read';
  /** The marimo version, shown in the UI. */
  version?: string;
  /** marimo user configuration (`display`, `runtime`, ...). */
  config?: Record<string, unknown>;
  /** Overrides on the user configuration. */
  configOverrides?: Record<string, unknown>;
  /** The notebook's app configuration (`width`, ...). */
  appConfig?: Record<string, unknown>;
  view?: { showAppCode: boolean };
  serverToken?: string;
}

/** Hands the kernel to the bridge; call before `mount`. */
export function connectKernel(port: KernelPort, options?: MarimoSessionOptions): void;

/** Mounts marimo's app into an element. marimo mounts once per page. */
export function mount(options: MarimoMountOptions, el: Element): Error | undefined;

/** The comm target the kernel host registers. */
export const COMM_TARGET: string;
/** The name the host is bound to in the kernel's namespace. */
export const HOST_NAME: string;
/** The Python source of the kernel host. */
export function kernelHostSource(target?: string, name?: string): string;

/** marimo's jotai store. */
export const store: {
  get<T>(atom: T): unknown;
  set<T>(atom: T, value: unknown): void;
  sub<T>(atom: T, listener: () => void): () => void;
};
/** marimo's notebook state atom (cells, runtime state, outputs). */
export const notebookAtom: unknown;
/** Registers marimo's UI element custom elements. */
export function initializePlugins(): void;
