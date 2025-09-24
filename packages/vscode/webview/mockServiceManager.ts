/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import type { ServiceManager } from '@jupyterlab/services';

/**
 * A mock service manager that doesn't actually execute cells
 * but provides the necessary interface for the Notebook component
 */
export function createMockServiceManager(): ServiceManager.IManager {
  const mockServiceManager = {
    ready: Promise.resolve(),
    isReady: true,
    disposed: { connect: () => {}, disconnect: () => {} },
    isDisposed: false,
    dispose: () => {},

    // Mock kernel spec manager
    kernelspecs: {
      ready: Promise.resolve(),
      isReady: true,
      specs: {
        default: 'python3',
        kernelspecs: {
          python3: {
            name: 'python3',
            display_name: 'Python 3 (Mock)',
            language: 'python',
            argv: [],
            metadata: {},
            resources: {},
          },
        },
      },
      refreshSpecs: () => Promise.resolve(),
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      specsChanged: { connect: () => {}, disconnect: () => {} },
    },

    // Mock kernel manager
    kernels: {
      ready: Promise.resolve(),
      isReady: true,
      runningChanged: { connect: () => {}, disconnect: () => {} },
      connectionFailure: { connect: () => {}, disconnect: () => {} },
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      running: () => [],
      refreshRunning: () => Promise.resolve(),
      startNew: async () => {
        throw new Error(
          'To enable running cells, you must select a kernel. Cell execution is not yet available for Datalayer notebooks.',
        );
      },
      findById: () => undefined,
      connectTo: () => {
        throw new Error(
          'To enable running cells, you must select a kernel. Cell execution is not yet available for Datalayer notebooks.',
        );
      },
      shutdown: () => Promise.resolve(),
      shutdownAll: () => Promise.resolve(),
    },

    // Mock session manager
    sessions: {
      ready: Promise.resolve(),
      isReady: true,
      runningChanged: { connect: () => {}, disconnect: () => {} },
      connectionFailure: { connect: () => {}, disconnect: () => {} },
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      running: () => [],
      refreshRunning: () => Promise.resolve(),
      startNew: async () => {
        throw new Error(
          'To enable running cells, you must select a kernel. Cell execution is not yet available for Datalayer notebooks.',
        );
      },
      findById: () => undefined,
      findByPath: () => undefined,
      connectTo: () => {
        throw new Error(
          'To enable running cells, you must select a kernel. Cell execution is not yet available for Datalayer notebooks.',
        );
      },
      shutdown: () => Promise.resolve(),
      shutdownAll: () => Promise.resolve(),
      stopIfNeeded: () => Promise.resolve(false),
      getModel: () => undefined,
    },

    // Mock contents manager
    contents: {
      ready: Promise.resolve(),
      isReady: true,
      fileChanged: { connect: () => {}, disconnect: () => {} },
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      driveName: () => '',
      localPath: () => '',
      normalize: (path: string) => path,
      resolvePath: (path: string) => path,
      get: () => Promise.reject(new Error('Contents not available')),
      getDownloadUrl: () => Promise.resolve(''),
      newUntitled: () => Promise.reject(new Error('Contents not available')),
      delete: () => Promise.reject(new Error('Contents not available')),
      rename: () => Promise.reject(new Error('Contents not available')),
      save: () => Promise.reject(new Error('Contents not available')),
      copy: () => Promise.reject(new Error('Contents not available')),
      createCheckpoint: () =>
        Promise.reject(new Error('Contents not available')),
      listCheckpoints: () => Promise.resolve([]),
      restoreCheckpoint: () =>
        Promise.reject(new Error('Contents not available')),
      deleteCheckpoint: () =>
        Promise.reject(new Error('Contents not available')),
      addDrive: () => {},
      getSharedModelFactory: () => undefined,
    },

    // Mock settings manager
    settings: {
      ready: Promise.resolve(),
      isReady: true,
      pluginChanged: { connect: () => {}, disconnect: () => {} },
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      fetch: () => Promise.reject(new Error('Settings not available')),
      save: () => Promise.reject(new Error('Settings not available')),
      remove: () => Promise.reject(new Error('Settings not available')),
      list: () => Promise.reject(new Error('Settings not available')),
    },

    // Mock workspace manager
    workspaces: {
      ready: Promise.resolve(),
      isReady: true,
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      fetch: () => Promise.reject(new Error('Workspaces not available')),
      save: () => Promise.reject(new Error('Workspaces not available')),
      remove: () => Promise.reject(new Error('Workspaces not available')),
      list: () => Promise.reject(new Error('Workspaces not available')),
      rename: () => Promise.reject(new Error('Workspaces not available')),
    },

    // Mock terminals manager
    terminals: {
      ready: Promise.resolve(),
      isReady: true,
      isAvailable: () => false,
      runningChanged: { connect: () => {}, disconnect: () => {} },
      connectionFailure: { connect: () => {}, disconnect: () => {} },
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      running: () => [],
      refreshRunning: () => Promise.resolve(),
      startNew: () => Promise.reject(new Error('Terminals not available')),
      connectTo: () => {
        throw new Error('Terminals not available');
      },
      shutdown: () => Promise.resolve(),
      shutdownAll: () => Promise.resolve(),
    },

    // Mock nbconvert manager
    nbconvert: {
      ready: Promise.resolve(),
      isReady: true,
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      getExportFormats: () =>
        Promise.reject(new Error('NBConvert not available')),
      fetchExport: () => Promise.reject(new Error('NBConvert not available')),
    },

    // Mock builder
    builder: {
      ready: Promise.resolve(),
      isReady: true,
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      isAvailable: () => false,
      shouldCheck: false,
      status: () => Promise.reject(new Error('Builder not available')),
      build: () => Promise.reject(new Error('Builder not available')),
      cancel: () => Promise.reject(new Error('Builder not available')),
      getStatus: () => Promise.reject(new Error('Builder not available')),
    },

    // Mock events manager
    events: {
      ready: Promise.resolve(),
      isReady: true,
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      stream: { connect: () => {}, disconnect: () => {} },
      emit: () => Promise.reject(new Error('Events not available')),
    },

    // Mock user manager
    user: {
      ready: Promise.resolve(),
      isReady: true,
      disposed: { connect: () => {}, disconnect: () => {} },
      isDisposed: false,
      dispose: () => {},
      userChanged: { connect: () => {}, disconnect: () => {} },
      identity: undefined,
      permissions: undefined,
      refreshUser: () => Promise.reject(new Error('User not available')),
    },

    // Server settings
    serverSettings: {
      baseUrl: '',
      appUrl: '',
      wsUrl: '',
      token: '',
      appendToken: false,
      init: {},
      fetch: globalThis.fetch.bind(globalThis),
      Headers: Headers,
      Request: Request,
      WebSocket: WebSocket,
    } as any,
  } as unknown as ServiceManager.IManager;

  console.log(
    '[MockServiceManager] Created mock service manager for Datalayer notebooks',
  );
  return mockServiceManager;
}
