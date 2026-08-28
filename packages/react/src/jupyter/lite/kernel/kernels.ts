/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { URLExt } from '@jupyterlab/coreutils';
import { IObservableMap, ObservableMap } from '@jupyterlab/observables';
import { KernelAPI, Kernel, KernelMessage } from '@jupyterlab/services';
import {
  deserialize,
  serialize,
} from '@jupyterlab/services/lib/kernel/serialize';
import { supportedKernelWebSocketProtocols } from '@jupyterlab/services/lib/kernel/messages';
import { UUID } from '@lumino/coreutils';
import { ISignal, Signal } from '@lumino/signaling';
import { Mutex } from 'async-mutex';
import {
  Server as WebSocketServer,
  Client as WebSocketClient,
} from 'mock-socket';
import { IKernel, IKernels, IKernelSpecs } from './tokens';

/**
 * Use the default kernel wire protocol.
 */
const KERNEL_WEBSOCKET_PROTOCOL =
  supportedKernelWebSocketProtocols.v1KernelWebsocketJupyterOrg;

/**
 * A class to handle requests to /api/kernels
 */
export class Kernels implements IKernels {
  /**
   * Construct a new Kernels
   *
   * @param options The instantiation options
   */
  constructor(options: Kernels.IOptions) {
    const { kernelspecs, wsBaseUrl } = options;
    this._kernelspecs = kernelspecs;
    this._wsBaseUrl = wsBaseUrl;
    // Forward the changed signal from _kernels
    this._kernels.changed.connect((_, args) => {
      this._changed.emit(args);
    });
  }

  /**
   * Signal emitted when the kernels map changes
   */
  get changed(): ISignal<this, IObservableMap.IChangedArgs<IKernel>> {
    return this._changed;
  }

  /**
   * Start a new kernel.
   *
   * @param options The kernel start options.
   */
  async startNew(options: Kernels.IKernelOptions): Promise<Kernel.IModel> {
    const { id, location } = options;

    // A notebook names the kernel it was written against — almost always
    // `python3`, the name a real Jupyter server uses. In the browser there is
    // one Python kernel and it is called `python`, so an unknown name resolves
    // to the default rather than failing: the notebook asked for Python and
    // Python is what is here.
    let name = options.name;
    let factory = this._kernelspecs.factories.get(name);
    if (!factory) {
      const fallback = this._kernelspecs.defaultKernelName;
      const fallbackFactory = this._kernelspecs.factories.get(fallback);
      if (fallbackFactory) {
        console.warn(
          `No kernel named '${name}'; starting the default '${fallback}' instead.`
        );
        name = fallback;
        factory = fallbackFactory;
      }
    }
    if (!factory) {
      // Nothing to run this on. Throwing beats returning a model with no
      // kernel behind it: that shape makes JupyterLab believe the kernel
      // started, and the failure surfaces later as `Kernel died unexpectedly`
      // with nothing to point at.
      const available = [...this._kernelspecs.factories.keys()];
      throw new Error(
        `No kernel named '${options.name}' is available in the browser` +
          (available.length ? `; this page has ${available.join(', ')}.` : '.')
      );
    }

    // create a synchronization mechanism to allow only one message
    // to be processed at a time
    const mutex = new Mutex();

    // hook a new client to a kernel
    const hook = (
      kernelId: string,
      clientId: string,
      socket: WebSocketClient
    ): void => {
      const kernel = this._kernels.get(kernelId);

      if (!kernel) {
        throw Error(`No kernel ${kernelId}`);
      }

      this._clients.set(clientId, socket);
      this._kernelClients.get(kernelId)?.add(clientId);

      const processMsg = async (msg: KernelMessage.IMessage) => {
        await mutex.runExclusive(async () => {
          await kernel.ready;
          await kernel.handleMessage(msg);
        });
      };

      socket.on(
        'message',
        async (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
          let msg;
          if (message instanceof ArrayBuffer) {
            message = new Uint8Array(message).buffer;
            msg = deserialize(message, KERNEL_WEBSOCKET_PROTOCOL);
          } else if (typeof message === 'string') {
            const encoder = new TextEncoder();
            const encodedData = encoder.encode(message);
            msg = deserialize(encodedData.buffer, KERNEL_WEBSOCKET_PROTOCOL);
          } else {
            return;
          }

          // TODO Find a better solution for this?
          // input-reply is asynchronous, must not be processed like other messages
          if (msg.header.msg_type === 'input_reply') {
            kernel.handleMessage(msg);
          } else {
            void processMsg(msg);
          }
        }
      );

      const removeClient = () => {
        this._clients.delete(clientId);
        this._kernelClients.get(kernelId)?.delete(clientId);
      };

      kernel.disposed.connect(removeClient);
      socket.onclose = removeClient;
    };

    // ensure kernel id
    const kernelId = id ?? UUID.uuid4();

    // There is one server per kernel which handles multiple clients
    const kernelUrl = URLExt.join(
      this._wsBaseUrl,
      KernelAPI.KERNEL_SERVICE_URL,
      encodeURIComponent(kernelId),
      'channels'
    );

    const runningKernel = this._kernels.get(kernelId);
    if (runningKernel) {
      return {
        id: runningKernel.id,
        name: runningKernel.name,
      };
    }

    // start the kernel
    const sendMessage = (msg: KernelMessage.IMessage): void => {
      const clientId = msg.header.session;
      const socket = this._clients.get(clientId);
      if (!socket) {
        console.warn(
          `Trying to send message on removed socket for kernel ${kernelId}`
        );
        return;
      }

      const message = serialize(msg, KERNEL_WEBSOCKET_PROTOCOL);
      // process iopub messages
      if (msg.channel === 'iopub') {
        const clients = this._kernelClients.get(kernelId);
        clients?.forEach(id => {
          this._clients.get(id)?.send(message);
        });
        return;
      }
      socket.send(message);
    };

    const kernel = await factory({
      id: kernelId,
      sendMessage,
      name,
      location,
    });

    this._kernels.set(kernelId, kernel);
    this._kernelClients.set(kernelId, new Set<string>());

    // create the websocket server for the kernel
    const wsServer = new WebSocketServer(kernelUrl, {
      mock: false,
      selectProtocol: () => KERNEL_WEBSOCKET_PROTOCOL,
    });
    wsServer.on('connection', (socket: WebSocketClient): void => {
      const url = new URL(socket.url);
      const clientId = url.searchParams.get('session_id') ?? '';
      hook(kernelId, clientId, socket);
    });

    // clean up closed connection
    wsServer.on('close', (): void => {
      this._clients.keys().forEach(clientId => {
        const socket = this._clients.get(clientId);
        if (socket?.readyState === WebSocket.CLOSED) {
          this._clients.delete(clientId);
          this._kernelClients.get(kernelId)?.delete(clientId);
        }
      });
    });

    // cleanup on kernel shutdown
    kernel.disposed.connect(() => {
      wsServer.close();
      this._kernels.delete(kernelId);
      this._kernelClients.delete(kernelId);
    });

    return {
      id: kernel.id,
      name: kernel.name,
    };
  }

  /**
   * Restart a kernel.
   *
   * @param kernelId The kernel id.
   */
  async restart(kernelId: string): Promise<Kernel.IModel> {
    const kernel = this._kernels.get(kernelId);
    if (!kernel) {
      throw Error(`Kernel ${kernelId} does not exist`);
    }
    const { id, name, location } = kernel;
    kernel.dispose();
    return this.startNew({ id, name, location });
  }

  /**
   * List the running kernels.
   */
  async list(): Promise<Kernel.IModel[]> {
    return [...this._kernels.values()].map(kernel => ({
      id: kernel.id,
      name: kernel.name,
    }));
  }

  /**
   * Shut down a kernel.
   *
   * @param id The kernel id.
   */
  async shutdown(id: string): Promise<void> {
    this._kernels.delete(id)?.dispose();
  }

  /**
   * Get a kernel by id
   */
  async get(id: string): Promise<IKernel | undefined> {
    return this._kernels.get(id);
  }

  private _kernels = new ObservableMap<IKernel>();
  private _clients = new ObservableMap<WebSocketClient>();
  private _kernelClients = new ObservableMap<Set<string>>();
  private _kernelspecs: IKernelSpecs;
  private _wsBaseUrl: string;
  private _changed = new Signal<this, IObservableMap.IChangedArgs<IKernel>>(
    this
  );
}

/**
 * A namespace for Kernels statics.
 */
export namespace Kernels {
  /**
   * Options to create a new Kernels.
   */
  export interface IOptions {
    /**
     * The kernel specs service.
     */
    kernelspecs: IKernelSpecs;

    /**
     * WebSocket base URL owned by this JupyterLite service manager.
     *
     * This must not be read later from PageConfig: another runtime target can
     * change that global while this in-page manager is still alive.
     */
    wsBaseUrl: string;
  }

  /**
   * Options to start a new kernel.
   */
  export interface IKernelOptions {
    /**
     * The kernel id.
     */
    id: string;

    /**
     * The kernel name.
     */
    name: string;

    /**
     * The location in the virtual filesystem from which the kernel was started.
     */
    location: string;
  }

}
