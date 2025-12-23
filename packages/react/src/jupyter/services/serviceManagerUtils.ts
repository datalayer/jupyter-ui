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
          // Access private _reconnectLimit property to disable auto-reconnect
          // CRITICAL: Use -1 to disable, NOT 0 (0 might mean "reconnect immediately")
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
                  kernelConnection._reconnectLimit = -1;
                  disabledKernelIds.add(kernelModel.id);
                  count++;
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
  // Disable auto-reconnect for all kernels
  disableKernelReconnect(serviceManager);

  // Now dispose - WebSocket closes won't trigger auto-reconnect
  serviceManager.dispose();
}
