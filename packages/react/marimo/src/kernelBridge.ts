/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * marimo's runtime bridge, over a Jupyter kernel.
 *
 * marimo's frontend reaches its kernel through two seams: the request client
 * (`EditRequests & RunRequests`, from `resolveRequestClient`) and the
 * connection transport that delivers kernel messages. In the browser (Pyodide)
 * build both are `core/wasm/bridge.ts`: a `PyodideBridge` that calls the
 * Python `PyodideBridge` by function name over a worker RPC, and a transport
 * fed by the worker's messages. This module replaces that file at build time
 * — same exports, same shapes — and speaks to the same Python bridge hosted
 * in a Jupyter kernel by `kernelHost.ts`, over a comm. A `<marimo-wasm>`
 * element on the page makes the rest of marimo take this path.
 *
 * The kernel is handed over with {@link connectKernel} before the app mounts,
 * as a {@link KernelPort}: the few things a Jupyter kernel connection has to
 * offer, so that this bundle depends on no Jupyter client library.
 *
 * @module marimo/kernelBridge
 */

import { toast } from '@/components/ui/use-toast';
import { userConfigAtom } from '@/core/config/config';
import { serializeBlob } from '@/utils/blob';
import { Deferred } from '@/utils/Deferred';
import { throwNotImplemented } from '@/utils/functions';
import { Logger } from '@/utils/Logger';
import { generateUUID } from '@/utils/uuid';
import { notebookIsRunningAtom } from '@/core/cells/cells';
import type { CommandMessage } from '@/core/kernel/messages';
import { getInitialAppMode } from '@/core/mode';
import type {
  EditRequests,
  EnvironmentInfo,
  ExportAsHTMLRequest,
  ExportAsMarkdownRequest,
  ExportAsScriptRequest,
  ExportedFile,
  FileCopyResponse,
  FileCreateResponse,
  FileDeleteResponse,
  FileDetailsResponse,
  FileListResponse,
  FileRootsResponse,
  FileMoveResponse,
  FileSearchResponse,
  FileUpdateResponse,
  FormatResponse,
  RunRequests,
  Snippets,
} from '@/core/network/types';
import { filenameAtom } from '@/core/saving/file-state';
import { store } from '@/core/state/jotai';
import { BasicTransport } from '@/core/websocket/transports/basic';
import type { IConnectionTransport } from '@/core/websocket/transports/transport';
import { wasmInitStateAtom } from '@/core/wasm/state';
import { fallbackFileStore, notebookFileStore } from '@/core/wasm/store';
import { COMM_TARGET, kernelHostSource } from './kernelHost';

/** A comm opened on the kernel: what the bridge sends and hears. */
export interface KernelComm {
  send(data: Record<string, unknown>): void;
  onMessage(handler: (data: Record<string, unknown>) => void): void;
  onClose(handler: () => void): void;
  close(): void;
}

/**
 * What the bridge needs from a Jupyter kernel connection. `kernelPort.ts` in
 * jupyter-react makes one from a JupyterLab `IKernelConnection`.
 */
export interface KernelPort {
  /** Run code in the kernel, silently; resolves when it is done, rejects on an error. */
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
  /** Install marimo into a kernel that lacks it (pip; a minute or two). Default true. */
  installMarimo?: boolean;
}

/** Whether the kernel can import marimo. */
const PROBE = 'import marimo';
/** Installs marimo where the kernel's Python lives. */
const INSTALL = [
  'import subprocess, sys',
  "subprocess.check_call([sys.executable, '-m', 'pip', 'install', '--quiet', 'marimo'])",
].join('\n');

type Pending = {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
};

let pendingKernel: { port: KernelPort; options: MarimoSessionOptions } | null =
  null;

/**
 * Hands the kernel to the bridge. Call it before marimo mounts: the bridge is
 * made by marimo's `resolveRequestClient` during `mount()` and starts the
 * session on the kernel it finds here.
 */
export function connectKernel(
  port: KernelPort,
  options: MarimoSessionOptions = {}
): void {
  pendingKernel = { port, options };
  const instance = (window as unknown as Record<string, unknown>)[
    INSTANCE_KEY
  ] as PyodideBridge | undefined;
  if (instance) {
    void instance.start(port, options);
  }
}

const INSTANCE_KEY = '_marimo_private_PyodideBridge';

/**
 * marimo's request client and message source, on a Jupyter kernel. Keeps the
 * name of the class it replaces so that every import of it stays valid.
 */
export class PyodideBridge implements RunRequests, EditRequests {
  static get INSTANCE(): PyodideBridge {
    const w = window as unknown as Record<string, unknown>;
    if (!w[INSTANCE_KEY]) {
      w[INSTANCE_KEY] = new PyodideBridge();
    }
    return w[INSTANCE_KEY] as PyodideBridge;
  }

  public initialized = new Deferred<void>();

  private port: KernelPort | undefined;
  private comm: KernelComm | undefined;
  private options: MarimoSessionOptions = {};
  private started = false;
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private messageConsumer:
    ((message: MessageEvent<string>) => void) | undefined;
  /** Resolved when the kernel host answers on the comm. */
  private ready = new Deferred<void>();
  /** Kernel messages that arrived before the app listened; delivered on attach. */
  private buffered: string[] = [];
  private pendingSessionSave: Promise<unknown> = Promise.resolve();

  private constructor() {
    if (pendingKernel) {
      const { port, options } = pendingKernel;
      void this.start(port, options);
    }
  }

  /** Installs the host in the kernel, opens the comm and starts the session. */
  async start(port: KernelPort, options: MarimoSessionOptions): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    this.port = port;
    this.options = options;
    try {
      store.set(wasmInitStateAtom, {
        kind: 'loading',
        message: 'Looking for marimo in the kernel...',
      });
      try {
        await port.execute(PROBE);
      } catch (missing) {
        if (options.installMarimo === false) {
          throw new Error(
            'The kernel has no marimo: install it there (pip install marimo).'
          );
        }
        Logger.log('marimo is not in the kernel, installing it', missing);
        store.set(wasmInitStateAtom, {
          kind: 'loading',
          message: 'Installing marimo in the kernel (a minute or two)...',
        });
        await port.execute(INSTALL);
      }
      store.set(wasmInitStateAtom, {
        kind: 'loading',
        message: 'Preparing the kernel for marimo...',
      });
      await port.execute(kernelHostSource());
      store.set(wasmInitStateAtom, {
        kind: 'loading',
        message: 'Opening the marimo session...',
      });
      const comm = await port.openComm(COMM_TARGET);
      this.comm = comm;
      comm.onMessage(data => this.onCommMessage(data));
      comm.onClose(() => {
        Logger.warn('The marimo comm closed');
        // Nothing answers any more: every request in flight fails now, and
        // later ones are refused rather than sent into a closed comm.
        this.comm = undefined;
        const gone = new Error('The kernel closed the marimo session.');
        for (const waiting of this.pending.values()) {
          waiting.reject(gone);
        }
        this.pending.clear();
        this.messageConsumer?.(
          new MessageEvent('message', {
            data: JSON.stringify({
              op: 'kernel-startup-error',
              data: { error: 'The kernel closed the marimo session.' },
            }),
          })
        );
      });
      await Promise.race([
        this.ready.promise,
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'The kernel did not answer on the marimo comm within 60s.'
                )
              ),
            60_000
          )
        ),
      ]);
      store.set(wasmInitStateAtom, {
        kind: 'loading',
        message: 'Starting the marimo notebook...',
      });
      await this.startSession();
      store.set(wasmInitStateAtom, { kind: 'ready' });
      this.initialized.resolve();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error('marimo could not start on the kernel', error);
      if (this.initialized.status === 'resolved') {
        toast({
          title: 'marimo error',
          description: message,
          variant: 'danger',
        });
        return;
      }
      store.set(wasmInitStateAtom, { kind: 'error', message });
      this.initialized.reject(
        error instanceof Error ? error : new Error(message)
      );
    }
  }

  private async startSession(): Promise<void> {
    const code =
      (await notebookFileStore.readFile()) ||
      (await fallbackFileStore.readFile()) ||
      '';
    const filename =
      this.options.filename ?? store.get(filenameAtom) ?? 'notebook.py';
    const userConfig = store.get(userConfigAtom);
    const autoInstantiate =
      getInitialAppMode() === 'read'
        ? true
        : userConfig.runtime.auto_instantiate;
    const started = (await this.request({
      kind: 'start',
      filename,
      code: this.options.code ?? code,
      queryParams: this.options.queryParams ?? {},
      userConfig: {
        ...userConfig,
        runtime: { ...userConfig.runtime, auto_instantiate: autoInstantiate },
      },
      autoInstantiate,
    })) as { filename?: string };
    if (started?.filename) {
      store.set(filenameAtom, started.filename);
    }
  }

  private onCommMessage(data: Record<string, unknown>): void {
    switch (data.kind) {
      case 'ready':
        this.ready.resolve();
        return;
      case 'kernel': {
        const message = String(data.message);
        if (this.messageConsumer) {
          this.messageConsumer(new MessageEvent('message', { data: message }));
        } else {
          this.buffered.push(message);
        }
        return;
      }
      case 'started':
      case 'result': {
        const waiting = this.pending.get(Number(data.id));
        this.pending.delete(Number(data.id));
        waiting?.resolve(data.kind === 'started' ? data : data.result);
        return;
      }
      case 'error': {
        const waiting = this.pending.get(Number(data.id));
        this.pending.delete(Number(data.id));
        const error = new Error(String(data.error));
        if (waiting) {
          waiting.reject(error);
        } else {
          Logger.error('marimo kernel host error', error);
        }
        return;
      }
      default:
        Logger.warn('Unknown marimo comm message', data);
    }
  }

  private request(payload: Record<string, unknown>): Promise<unknown> {
    if (!this.comm) {
      return Promise.reject(new Error('The marimo session has no kernel.'));
    }
    const id = this.nextId++;
    Logger.debug('marimo → kernel', payload.kind, payload.function ?? '');
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.comm!.send({ ...payload, id });
    });
  }

  /**
   * Calls a method of marimo's Python `PyodideBridge` by name. Payloads travel
   * as JSON strings, the way the Pyodide worker sends them; JSON answers come
   * back parsed.
   */
  private async bridge<T = unknown>(
    functionName: string,
    payload?: unknown
  ): Promise<T> {
    await this.initialized.promise.catch(() => undefined);
    const serialized =
      payload == null
        ? null
        : typeof payload === 'string'
          ? payload
          : JSON.stringify(payload);
    const result = await this.request({
      kind: 'bridge',
      function: functionName,
      payload: serialized,
    });
    if (typeof result === 'string') {
      try {
        return JSON.parse(result) as T;
      } catch {
        return result as T;
      }
    }
    return result as T;
  }

  attachMessageConsumer(
    consumer: (message: MessageEvent<string>) => void
  ): void {
    this.messageConsumer = consumer;
    const buffered = this.buffered;
    this.buffered = [];
    for (const message of buffered) {
      consumer(new MessageEvent('message', { data: message }));
    }
  }

  // The kernel uses msgspec to parse control requests, which requires a 'type'
  // field for discriminated union deserialization.
  private async putControlRequest(operation: CommandMessage): Promise<void> {
    await this.bridge('put_control_request', operation);
  }

  sendRename: EditRequests['sendRename'] = async ({ filename }) => {
    if (filename === null) {
      return null;
    }
    await this.bridge('rename_file', filename);
    store.set(filenameAtom, filename);
    return null;
  };

  sendSave: EditRequests['sendSave'] = async request => {
    this.pendingSessionSave = this.pendingSessionSave
      .catch(() => undefined)
      .then(() => this.bridge('save', request));
    await this.pendingSessionSave;
    const code = await this.readCode();
    if (code.contents) {
      notebookFileStore.saveFile(code.contents);
      fallbackFileStore.saveFile(code.contents);
    }
    return null;
  };

  sendCopy: EditRequests['sendCopy'] = async () => {
    throwNotImplemented();
  };

  sendStdin: EditRequests['sendStdin'] = async request => {
    await this.bridge('put_input', request.text);
    return null;
  };

  sendPdb: EditRequests['sendPdb'] = async () => {
    throwNotImplemented();
  };

  sendSetBreakpoints: EditRequests['sendSetBreakpoints'] = async () => {
    throwNotImplemented();
  };

  sendRun: EditRequests['sendRun'] = async request => {
    await this.putControlRequest({ type: 'execute-cells', ...request });
    return null;
  };

  sendRunScratchpad: EditRequests['sendRunScratchpad'] = async request => {
    await this.putControlRequest({ type: 'execute-scratchpad', ...request });
    return null;
  };

  sendInterrupt: EditRequests['sendInterrupt'] = async () => {
    // A Jupyter interrupt is SIGINT to the kernel; marimo's handler turns it
    // into an interrupt of the running cell.
    await this.port?.interrupt();
    return null;
  };

  sendShutdown: EditRequests['sendShutdown'] = async () => {
    this.comm?.send({ kind: 'stop' });
    return null;
  };

  sendFormat: EditRequests['sendFormat'] = async request => {
    return this.bridge<FormatResponse>('format', request);
  };

  sendDeleteCell: EditRequests['sendDeleteCell'] = async request => {
    await this.putControlRequest({ type: 'delete-cell', ...request });
    return null;
  };

  sendInstallMissingPackages: EditRequests['sendInstallMissingPackages'] =
    async request => {
      await this.putControlRequest({ type: 'install-packages', ...request });
      return null;
    };

  sendCodeCompletionRequest: EditRequests['sendCodeCompletionRequest'] =
    async request => {
      if (!store.get(notebookIsRunningAtom)) {
        await this.bridge('code_complete', request);
      }
      return null;
    };

  saveUserConfig: EditRequests['saveUserConfig'] = async request => {
    await this.bridge('save_user_config', request);
    return null;
  };

  saveAppConfig: EditRequests['saveAppConfig'] = async request => {
    await this.bridge('save_app_config', request);
    return null;
  };

  saveCellConfig: EditRequests['saveCellConfig'] = async request => {
    await this.putControlRequest({ type: 'update-cell-config', ...request });
    return null;
  };

  sendRestart = async (): Promise<null> => {
    toast({
      title: 'Restart the kernel',
      description: 'Restart the Jupyter kernel to restart marimo.',
      variant: 'default',
    });
    return null;
  };

  readCode: EditRequests['readCode'] = async () => {
    return this.bridge<{ contents: string }>('read_code');
  };

  readSnippets: EditRequests['readSnippets'] = async () => {
    return this.bridge<Snippets>('read_snippets');
  };

  openFile: EditRequests['openFile'] = async () => {
    throwNotImplemented();
  };

  sendListFiles: EditRequests['sendListFiles'] = async request => {
    return this.bridge<FileListResponse>('list_files', request);
  };

  getFileRoots: EditRequests['getFileRoots'] = async () => {
    return this.bridge<FileRootsResponse>('file_roots');
  };

  sendSearchFiles: EditRequests['sendSearchFiles'] = async request => {
    return this.bridge<FileSearchResponse>('search_files', request);
  };

  sendComponentValues: RunRequests['sendComponentValues'] = async request => {
    await this.putControlRequest({
      type: 'update-ui-element',
      ...request,
      token: generateUUID(),
    });
    return null;
  };

  sendInstantiate: RunRequests['sendInstantiate'] = async () => {
    // The host instantiates the notebook when the session starts.
    return null;
  };

  sendFunctionRequest: RunRequests['sendFunctionRequest'] = async request => {
    await this.putControlRequest({ type: 'invoke-function', ...request });
    return null;
  };

  sendCreateFileOrFolder: EditRequests['sendCreateFileOrFolder'] =
    async request => {
      let contents: string | null = null;
      if (request.file) {
        const dataUrl = await serializeBlob(request.file);
        contents = dataUrl.split(',')[1] ?? '';
      }
      return this.bridge<FileCreateResponse>('create_file_or_directory', {
        path: request.path,
        type: request.type,
        name: request.name,
        contents,
      });
    };

  sendDeleteFileOrFolder: EditRequests['sendDeleteFileOrFolder'] =
    async request => {
      return this.bridge<FileDeleteResponse>(
        'delete_file_or_directory',
        request
      );
    };

  sendCopyFileOrFolder: EditRequests['sendCopyFileOrFolder'] =
    async request => {
      return this.bridge<FileCopyResponse>('copy_file_or_directory', request);
    };

  sendRenameFileOrFolder: EditRequests['sendRenameFileOrFolder'] =
    async request => {
      return this.bridge<FileMoveResponse>('move_file_or_directory', request);
    };

  sendUpdateFile: EditRequests['sendUpdateFile'] = async request => {
    return this.bridge<FileUpdateResponse>('update_file', request);
  };

  sendFileDetails: EditRequests['sendFileDetails'] = async request => {
    return this.bridge<FileDetailsResponse>('file_details', request);
  };

  exportAsHTML: EditRequests['exportAsHTML'] = async (
    request: ExportAsHTMLRequest
  ) => {
    await this.pendingSessionSave;
    return this.bridge<ExportedFile<string>>('export_html', request);
  };

  exportAsMarkdown: EditRequests['exportAsMarkdown'] = async (
    request: ExportAsMarkdownRequest
  ) => {
    await this.pendingSessionSave;
    return this.bridge<ExportedFile<string>>('export_markdown', request);
  };

  exportAsScript: EditRequests['exportAsScript'] = async (
    request: ExportAsScriptRequest
  ) => {
    await this.pendingSessionSave;
    return this.bridge<ExportedFile<string>>('export_script', request);
  };

  previewDatasetColumn: EditRequests['previewDatasetColumn'] =
    async request => {
      await this.putControlRequest({
        type: 'preview-dataset-column',
        ...request,
      });
      return null;
    };

  previewSQLTable: EditRequests['previewSQLTable'] = async request => {
    await this.putControlRequest({ type: 'preview-sql-table', ...request });
    return null;
  };

  previewSQLTableList: EditRequests['previewSQLTableList'] = async request => {
    await this.putControlRequest({ type: 'list-sql-tables', ...request });
    return null;
  };

  previewSQLSchemaList: EditRequests['previewSQLSchemaList'] =
    async request => {
      await this.putControlRequest({ type: 'list-sql-schemas', ...request });
      return null;
    };

  previewDataSourceConnection: EditRequests['previewDataSourceConnection'] =
    async request => {
      await this.putControlRequest({
        type: 'list-data-source-connection',
        ...request,
      });
      return null;
    };

  validateSQL: EditRequests['validateSQL'] = async request => {
    await this.putControlRequest({ type: 'validate-sql', ...request });
    return null;
  };

  sendModelValue: RunRequests['sendModelValue'] = async request => {
    await this.putControlRequest({ type: 'model', ...request });
    return null;
  };

  sendDocumentTransaction = () => Promise.resolve(null);

  addPackage: EditRequests['addPackage'] = async () => {
    throw new Error('Install packages with pip in the kernel.');
  };

  removePackage: EditRequests['removePackage'] = async () => {
    throw new Error('Remove packages with pip in the kernel.');
  };

  getPackageList = async () => ({ packages: [] });

  getSandbox: EditRequests['getSandbox'] = async () => ({
    backend: null,
    manifest: null,
    filename: null,
  });

  updateManifest: EditRequests['updateManifest'] = async () => {
    throw new Error('Sandboxes are not supported on a Jupyter kernel');
  };

  syncSandbox: EditRequests['syncSandbox'] = async () => {
    throw new Error('Sandboxes are not supported on a Jupyter kernel');
  };

  getDependencyTree: EditRequests['getDependencyTree'] = async () => ({
    tree: { dependencies: [], name: '', tags: [], version: null },
    context: { kind: 'package-manager', name: 'pip' },
  });

  listSecretKeys: EditRequests['listSecretKeys'] = async request => {
    await this.putControlRequest({ type: 'list-secret-keys', ...request });
    return null;
  };

  discoverDataSources: EditRequests['discoverDataSources'] = async request => {
    await this.putControlRequest({ type: 'discover-data-sources', ...request });
    return null;
  };

  getUsageStats = throwNotImplemented;

  getEnvironmentInfo: EditRequests['getEnvironmentInfo'] = async () => {
    return this.bridge<EnvironmentInfo>('get_environment_info');
  };

  openTutorial = throwNotImplemented;
  getRecentFiles = throwNotImplemented;
  getWorkspaceFiles = throwNotImplemented;
  getRunningNotebooks = throwNotImplemented;
  shutdownSession = throwNotImplemented;
  getExportAvailability = throwNotImplemented;
  installExportRequirements = throwNotImplemented;
  exportAsIPYNB = throwNotImplemented;
  exportAsPDF = throwNotImplemented;
  autoExportAsHTML = throwNotImplemented;
  autoExportAsMarkdown = throwNotImplemented;
  autoExportAsIPYNB = throwNotImplemented;
  updateCellOutputs = throwNotImplemented;
  writeSecret = throwNotImplemented;
  invokeAiTool = throwNotImplemented;
  clearCache = throwNotImplemented;
  getCacheInfo = throwNotImplemented;
  listStorageEntries = throwNotImplemented;
  downloadStorage = throwNotImplemented;
}

/** The transport marimo's connection hook uses: the bridge's kernel messages. */
export function createPyodideConnection(): IConnectionTransport {
  return BasicTransport.withProducerCallback(callback => {
    PyodideBridge.INSTANCE.attachMessageConsumer(callback);
  });
}

/** Kept for the imports of the module this one replaces. */
export function getWasmWorkerName(): string {
  return 'marimo';
}
