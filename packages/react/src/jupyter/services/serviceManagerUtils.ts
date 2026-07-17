/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Utility functions for working with JupyterLab ServiceManager instances.
 *
 * ## Problem
 *
 * When disposing a ServiceManager with active kernels, the KernelConnection
 * instances automatically attempt to reconnect when their WebSockets close.
 * This causes CORS/502 errors when the server is already terminated.
 *
 * ## Solution
 *
 * These utilities disable auto-reconnection for all kernels BEFORE disposal,
 * preventing reconnection attempts to dead servers.
 *
 * ## Usage
 *
 * ```typescript
 * import { disposeServiceManager } from '@datalayer/jupyter-react';
 *
 * // Dispose with automatic reconnect disabling
 * disposeServiceManager(serviceManager);
 * ```
 *
 * @module serviceManagerUtils
 */

import { ServiceManager } from '@jupyterlab/services';
import { Signal } from '@lumino/signaling';

// Track managers we are already disposing/disposed to avoid duplicate teardown
// across overlapping React lifecycle paths.
const disposalGuard = new WeakSet<object>();

function isAlreadyDisposedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const message = String((error as { message?: unknown }).message ?? '');
  return message.includes('is disposed');
}

/**
 * Sub-manager accessors on a ServiceManager that expose a `ready` promise.
 *
 * These managers each set an internal `_ready` promise in their constructor
 * that awaits their first poll tick (e.g. `SessionManager` awaits
 * `this._pollModels.tick`). If the manager is disposed BEFORE that first tick
 * resolves, the poll rejects the pending tick with `Poll (...) is disposed.`,
 * which propagates out of the `_ready` async initializer. Because nothing
 * awaits `ready` with a rejection handler, this surfaces as an uncaught
 * promise rejection in the console.
 */
const READY_SUBMANAGER_KEYS = [
  'sessions',
  'kernels',
  'kernelspecs',
  'contents',
  'terminals',
  'settings',
  'user',
  'workspaces',
  'nbconvert',
  'builder',
] as const;

/**
 * Attach a no-op rejection handler to the `ready` promise of a service manager
 * and each of its sub-managers.
 *
 * This is the correct fix for the "Poll (...) is disposed." uncaught rejection:
 * when we dispose a manager before it becomes ready, its `_ready` promise
 * rejects. Registering a handler on that exact promise (via `ready.catch`)
 * marks it as handled, so the expected rejection no longer surfaces as an
 * uncaught promise error. Managers that resolve normally are unaffected.
 *
 * @param serviceManager - The service manager about to be disposed.
 */
function handleReadyRejections(serviceManager: ServiceManager.IManager): void {
  const swallow = (ready: unknown): void => {
    if (
      ready &&
      typeof (ready as { then?: unknown }).then === 'function' &&
      typeof (ready as { catch?: unknown }).catch === 'function'
    ) {
      (ready as Promise<unknown>).catch(() => undefined);
    }
  };

  const managerAny = serviceManager as unknown as Record<
    string,
    { ready?: unknown } | undefined
  >;

  // The ServiceManager itself exposes an aggregate `ready` promise.
  try {
    swallow(managerAny?.ready);
  } catch {
    // Accessing `ready` should never throw, but stay defensive.
  }

  for (const key of READY_SUBMANAGER_KEYS) {
    try {
      const subManager = managerAny?.[key];
      swallow(subManager?.ready);
    } catch {
      // Ignore managers that are absent or throw on access.
    }
  }
}

/**
 * Disable auto-reconnection for all running kernels in a service manager.
 *
 * This function accesses the private `_reconnectLimit` property of each kernel
 * to prevent automatic reconnection attempts when WebSockets close.
 *
 * @param serviceManager - The service manager instance
 * @returns Number of kernels that had reconnection disabled
 *
 * @remarks
 * Accessing `_reconnectLimit` is necessary because JupyterLab doesn't expose
 * a public API to disable auto-reconnection. This is safe because:
 * 1. We control this package
 * 2. It's for graceful shutdown only
 * 3. Prevents user-facing CORS errors
 *
 * TODO: Propose upstream fix to add kernel.disableReconnect() to @jupyterlab/services
 *
 * @example
 * ```typescript
 * // Disable reconnect, then dispose manually
 * disableKernelReconnect(serviceManager);
 * serviceManager.dispose();
 * ```
 */
export function disableKernelReconnect(
  serviceManager: ServiceManager.IManager
): number {
  let count = 0;
  const disabledKernelIds = new Set<string>();

  try {
    // CRITICAL: Check BOTH sessions AND kernels!
    // Kernels can exist without sessions (orphaned kernels)

    // 1. Disable reconnect for kernels in sessions
    const sessionManager = serviceManager.sessions;
    if (sessionManager && typeof sessionManager.running === 'function') {
      const runningSessions = Array.from(sessionManager.running());

      for (const session of runningSessions) {
        if (session.kernel && session.kernel.id) {
          // Access private _reconnectLimit property to prevent further auto-reconnect attempts.
          // NOTE: Using -1 here is based on the current JupyterLab KernelConnection implementation.
          // If JupyterLab changes the semantics of _reconnectLimit, this value may need to be updated.
          (session.kernel as any)._reconnectLimit = -1;
          disabledKernelIds.add(session.kernel.id);
          count++;
        }
      }
    }

    // 2. Disable reconnect for orphaned kernels (not in sessions)
    const kernelManager = serviceManager.kernels;
    if (kernelManager && typeof kernelManager.running === 'function') {
      const runningKernels = Array.from(kernelManager.running());

      for (const kernelModel of runningKernels) {
        // Skip if we already disabled this kernel via session
        if (disabledKernelIds.has(kernelModel.id)) {
          continue;
        }

        // Access private _kernels map to get actual KernelConnection objects
        // KernelManager.running() returns models, but we need connections to set _reconnectLimit
        try {
          const kernelManagerPrivate = kernelManager as any;
          const kernelsMap = kernelManagerPrivate._kernelConnections;

          if (kernelsMap) {
            // _kernelConnections is a Set, not a Map
            if (kernelsMap instanceof Set) {
              // Iterate through ALL kernel connections in the Set
              for (const kernelConnection of kernelsMap) {
                if (
                  kernelConnection &&
                  kernelConnection._reconnectLimit !== undefined
                ) {
                  const connectionId =
                    (kernelConnection as any).id ?? kernelModel.id;

                  // Avoid double-disabling / double-counting
                  if (!disabledKernelIds.has(connectionId)) {
                    kernelConnection._reconnectLimit = -1;
                    disabledKernelIds.add(connectionId);
                    count++;
                  }
                }
              }
            } else if (kernelsMap instanceof Map) {
              // Fallback: Keep Map logic in case structure changes
              const kernelConnection = kernelsMap.get(kernelModel.id);
              if (
                kernelConnection &&
                kernelConnection._reconnectLimit !== undefined
              ) {
                kernelConnection._reconnectLimit = -1;
                disabledKernelIds.add(kernelModel.id);
                count++;
              }
            }
          }
        } catch (error) {
          console.error(
            `[serviceManagerUtils] Error disabling orphaned kernel ${kernelModel.id}:`,
            error
          );
        }
      }
    }
  } catch (error) {
    console.error(
      '[serviceManagerUtils] Error disabling auto-reconnect:',
      error
    );
  }

  return count;
}

/**
 * Minimal structural view of a JupyterLab `KernelConnection` exposing the
 * private fields we touch to guarantee a clean, reconnect-free teardown.
 */
interface KernelConnectionLike {
  id?: string;
  isDisposed?: boolean;
  dispose?: () => void;
  _reconnectLimit?: number;
  _reconnectTimeout?: ReturnType<typeof setTimeout> | null;
  kernel?: KernelConnectionLike;
}

/**
 * Collect every live {@link https://jupyterlab.readthedocs.io | KernelConnection}
 * reachable from a service manager: the kernel of each running session plus any
 * orphaned kernel connections tracked by the KernelManager.
 *
 * @param serviceManager - The service manager instance.
 * @returns The deduplicated set of kernel connection objects.
 */
function collectKernelConnections(
  serviceManager: ServiceManager.IManager
): Set<KernelConnectionLike> {
  const connections = new Set<KernelConnectionLike>();

  try {
    const sessionManager = serviceManager.sessions;
    if (sessionManager && typeof sessionManager.running === 'function') {
      for (const session of Array.from(sessionManager.running())) {
        // `session` is a model, but the live SessionConnection exposes the
        // actual kernel connection. Prefer the manager's tracked connections.
        const sessionConnections = (
          sessionManager as unknown as {
            _sessionConnections?: Set<{ kernel?: KernelConnectionLike }>;
          }
        )._sessionConnections;
        if (sessionConnections instanceof Set) {
          for (const sessionConnection of sessionConnections) {
            const kernel = sessionConnection?.kernel;
            if (kernel) {
              connections.add(kernel);
            }
          }
        } else if (session.kernel) {
          connections.add(session.kernel as KernelConnectionLike);
        }
      }
    }

    const kernelManager = serviceManager.kernels;
    const kernelConnections = (
      kernelManager as unknown as {
        _kernelConnections?:
          Set<KernelConnectionLike> | Map<string, KernelConnectionLike>;
      }
    )?._kernelConnections;
    if (kernelConnections instanceof Set) {
      for (const kernelConnection of kernelConnections) {
        if (kernelConnection) {
          connections.add(kernelConnection);
        }
      }
    } else if (kernelConnections instanceof Map) {
      for (const kernelConnection of kernelConnections.values()) {
        if (kernelConnection) {
          connections.add(kernelConnection);
        }
      }
    }
  } catch (error) {
    console.error(
      '[serviceManagerUtils] Error collecting kernel connections:',
      error
    );
  }

  return connections;
}

/**
 * Dispose every kernel client connection reachable from a service manager.
 *
 * ## Why this is the correct fix
 *
 * When a runtime/agent is terminated, disposing the service manager closes each
 * kernel WebSocket. `KernelConnection._onWSClose` then runs and, unless the
 * connection is already disposed, calls `_reconnect()` — issuing a fresh
 * `GET /api/kernels` (and re-opening the WebSocket) against a pod that no longer
 * exists, producing CORS / `net::ERR_FAILED` noise.
 *
 * `_onWSClose` short-circuits with `if (this.isDisposed) return;`. By disposing
 * the KernelConnection **before** the manager tears the socket down, the close
 * handler returns immediately and never schedules a reconnect. We also set
 * `_reconnectLimit = -1` as a belt-and-suspenders guard for any connection that
 * cannot be disposed directly.
 *
 * @param serviceManager - The service manager whose kernel clients to dispose.
 * @returns Number of kernel connections that were disposed.
 */
/**
 * Sub-managers that poll the server and react to their kernel/session
 * connections' `disposed` signal by refreshing running state.
 */
const SIGNAL_RECEIVER_SUBMANAGER_KEYS = [
  'kernels',
  'sessions',
  'kernelspecs',
  'terminals',
] as const;

/**
 * Detach a service manager's sub-managers from every signal they receive.
 *
 * ## Why this is required
 *
 * `KernelManager._onDisposed` (and the analogous session handler) is wired to
 * each connection's `disposed` signal and calls `refreshRunning()` -> a fresh
 * `GET /api/kernels` (or `/api/sessions`). Disposing the manager iterates
 * `this._kernelConnections.forEach(x => x.dispose())`, so tearing a manager down
 * *itself* fires `_onDisposed` for every connection -> a burst of requests
 * against a pod that no longer exists (CORS / `net::ERR_FAILED`).
 *
 * `Signal.disconnectReceiver` removes the sub-manager as a receiver from ALL
 * signals (connection `disposed`/`statusChanged`, poll `ticked`, ...), so the
 * imminent connection disposals can no longer schedule a refresh. This is safe
 * because we are disposing the manager immediately afterwards.
 *
 * @param serviceManager - The service manager about to be disposed.
 */
function detachManagerSignals(serviceManager: ServiceManager.IManager): void {
  const managerAny = serviceManager as unknown as Record<string, unknown>;
  for (const key of SIGNAL_RECEIVER_SUBMANAGER_KEYS) {
    try {
      const subManager = managerAny?.[key];
      if (subManager && typeof subManager === 'object') {
        Signal.disconnectReceiver(subManager);
      }
    } catch (error) {
      console.warn(
        `[serviceManagerUtils] Failed detaching signals for ${key}:`,
        error
      );
    }
  }
}

export function disposeKernelConnections(
  serviceManager: ServiceManager.IManager
): number {
  let count = 0;

  for (const kernelConnection of collectKernelConnections(serviceManager)) {
    try {
      // Guard against reconnect even if dispose is a no-op on this build.
      if (kernelConnection._reconnectLimit !== undefined) {
        kernelConnection._reconnectLimit = -1;
      }
      // Cancel any pending reconnect timer scheduled before we got here.
      if (kernelConnection._reconnectTimeout) {
        clearTimeout(kernelConnection._reconnectTimeout);
        kernelConnection._reconnectTimeout = null;
      }
      if (
        typeof kernelConnection.dispose === 'function' &&
        kernelConnection.isDisposed !== true
      ) {
        kernelConnection.dispose();
        count++;
      }
    } catch (error) {
      if (!isAlreadyDisposedError(error)) {
        console.warn(
          '[serviceManagerUtils] Error disposing kernel connection:',
          error
        );
      }
    }
  }

  return count;
}

/**
 * Dispose a service manager without auto-reconnection errors.
 *
 * This is a convenience wrapper that:
 * 1. Disables auto-reconnection for all kernels
 * 2. Calls dispose() on the service manager
 *
 * @param serviceManager - The service manager to dispose
 *
 * @example
 * ```typescript
 * import { disposeServiceManager } from '@datalayer/jupyter-react';
 *
 * // Instead of:
 * serviceManager.dispose(); // ❌ May cause CORS errors
 *
 * // Use:
 * disposeServiceManager(serviceManager); // ✅ Clean disposal
 * ```
 */
export function disposeServiceManager(
  serviceManager: ServiceManager.IManager
): void {
  if (!serviceManager || typeof serviceManager !== 'object') {
    return;
  }

  if (disposalGuard.has(serviceManager as object)) {
    return;
  }

  const managerAny = serviceManager as any;
  if (managerAny?.isDisposed === true) {
    disposalGuard.add(serviceManager as object);
    return;
  }

  disposalGuard.add(serviceManager as object);

  // Handle the `ready` rejection that disposal triggers when a manager is torn
  // down before its first poll tick resolves. Registering a rejection handler
  // on the exact `_ready` promise prevents an uncaught "Poll (...) is disposed."
  // rejection without suppressing genuine errors.
  handleReadyRejections(serviceManager);

  // Detach the sub-managers from their connections' `disposed` signal BEFORE
  // anything is disposed. Otherwise disposing a kernel/session connection fires
  // `KernelManager._onDisposed` -> `refreshRunning()` -> GET /api/kernels
  // against the terminated pod (CORS / ERR_FAILED).
  detachManagerSignals(serviceManager);

  // Disable auto-reconnect for all kernels
  try {
    disableKernelReconnect(serviceManager);
  } catch (error) {
    if (!isAlreadyDisposedError(error)) {
      console.warn(
        '[serviceManagerUtils] Failed disabling auto-reconnect during dispose:',
        error
      );
    }
  }

  // Dispose the kernel client connections BEFORE disposing the manager. A
  // disposed KernelConnection makes `_onWSClose` short-circuit, so the imminent
  // WebSocket close during manager teardown cannot trigger `_reconnect` ->
  // GET /api/kernels against a terminated pod (CORS / ERR_FAILED).
  try {
    disposeKernelConnections(serviceManager);
  } catch (error) {
    if (!isAlreadyDisposedError(error)) {
      console.warn(
        '[serviceManagerUtils] Failed disposing kernel connections during dispose:',
        error
      );
    }
  }

  // Now dispose - WebSocket closes won't trigger auto-reconnect
  try {
    const maybePromise = (serviceManager as any).dispose();
    if (
      maybePromise &&
      typeof maybePromise === 'object' &&
      typeof maybePromise.then === 'function'
    ) {
      maybePromise.catch((error: unknown) => {
        if (!isAlreadyDisposedError(error)) {
          console.warn('[serviceManagerUtils] Async dispose failed:', error);
        }
      });
    }
  } catch (error) {
    if (!isAlreadyDisposedError(error)) {
      throw error;
    }
  }
}
