/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module serviceManager
 * Service manager for Jupyter kernel communication.
 * Creates a fake JupyterLab service manager that proxies requests through postMessage.
 * Implements WebSocket proxying for real-time kernel communication.
 */

/**
 * Fake JupyterLab service manager that proxy the requests and websockets
 * through postMessage
 *
 * The fake WebSocket is largely copied from mock-server licensed under MIT License.
 */

import { ServiceManager, ServerConnection } from '@jupyterlab/services';
import { MessageHandler, type ExtensionMessage } from './messageHandler';

/**
 * Forward HTTP request through postMessage to the extension.
 *
 * @param request HTTP request
 * @param init HTTP request initialization
 * @returns HTTP response
 */
async function fetch(
  request: RequestInfo,
  init?: RequestInit | null,
): Promise<Response> {
  const r = new Request(request, init ?? undefined);
  const body = !['GET', 'HEAD'].includes(r.method)
    ? await r.arrayBuffer()
    : undefined;
  const headers: Record<string, string> = [...r.headers].reduce(
    (agg, pair) => ({ ...agg, [pair[0]]: pair[1] }),
    {},
  );
  const reply = await MessageHandler.instance.postRequest({
    type: 'http-request',
    body: {
      method: r.method,
      url: r.url,
      body,
      headers,
    },
  });
  {
    const { headers, body, status, statusText } = reply.body ?? {};
    return new Response(body, { headers, status, statusText });
  }
}

/**
 * Create a JupyterLab service manager with proxied communication.
 * @param baseUrl Base URL for the Jupyter server
 * @param token Authentication token for the server
 * @returns ServiceManager instance configured for VS Code extension communication
 */
export function createServiceManager(
  baseUrl: string,
  token: string = '',
): ServiceManager {
  const refSettings = ServerConnection.makeSettings();

  // The token will be appended as a query parameter by Jupyter itself
  // when appendToken is true, so we don't need it in headers
  return new ServiceManager({
    serverSettings: {
      ...refSettings,
      appendToken: true, // Append token as query parameter
      baseUrl,
      appUrl: '',
      fetch: fetch,
      init: {
        cache: 'no-store',
        credentials: 'same-origin',
      } as any,
      token, // This is the runtime-specific token, not the JWT auth token
      WebSocket: WebSocket as any,
      wsUrl: baseUrl.replace(/^http/, 'ws'),
    },
  });
}

/*
 * Code modified from mock-socket
 */

const ERROR_PREFIX = {
  CONSTRUCTOR_ERROR: "Failed to construct 'WebSocket':",
  CLOSE_ERROR: "Failed to execute 'close' on 'WebSocket':",
  EVENT: {
    CONSTRUCT: "Failed to construct 'Event':",
    MESSAGE: "Failed to construct 'MessageEvent':",
    CLOSE: "Failed to construct 'CloseEvent':",
  },
};

/**
 * Configuration for creating Event objects
 */
interface IEventConfiguration {
  /** Event type string */
  type: string;
  /** Target element for the event */
  target?: any;
}

/**
 * Configuration for creating CloseEvent objects
 */
interface ICloseEventConfiguration extends IEventConfiguration {
  /** Close code (1000 for normal closure) */
  code?: number;
  /** Human-readable close reason */
  reason?: string;
  /** Whether the connection closed cleanly */
  wasClean?: boolean;
}

/*
 * Creates an Event object and extends it to allow full modification of
 * its properties.
 *
 * @param {object} config - within config you will need to pass type and optionally target
 */
function createEvent(config: IEventConfiguration) {
  const { type, target } = config;
  const eventObject = new Event(type);
  if (target) {
    (eventObject as any).target = target;
    (eventObject as any).srcElement = target;
    (eventObject as any).currentTarget = target;
  }
  return eventObject;
}

/*
 * Creates a CloseEvent object and extends it to allow full modification of
 * its properties.
 *
 * @param {object} config - within config: type and optionally target, code, and reason
 */
function createCloseEvent(config: ICloseEventConfiguration) {
  const { code, reason, type, target } = config;
  let { wasClean } = config;
  if (!wasClean) {
    wasClean = code === 1000;
  }
  const closeEvent = new CloseEvent(type, {
    code,
    reason,
    wasClean,
  });
  if (target) {
    (closeEvent as any).target = target;
    (closeEvent as any).srcElement = target;
    (closeEvent as any).currentTarget = target;
  }
  return closeEvent;
}

function lengthInUtf8Bytes(str: string): number {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  const m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}

function normalizeSendData(data) {
  // FIXME this does not work -> JupyterLab fails to serialize the data
  // when the protocol is v1.kernel.websocket.jupyter.org
  if (
    Object.prototype.toString.call(data) !== '[object Blob]' &&
    !(data instanceof ArrayBuffer)
  ) {
    data = String(data);
  }
  return data;
}

function protocolVerification(protocols?: string | string[]): string[] {
  protocols = protocols ?? new Array<string>();
  if (!Array.isArray(protocols) && typeof protocols !== 'string') {
    throw new SyntaxError(
      `${ERROR_PREFIX.CONSTRUCTOR_ERROR} The subprotocol '${(
        protocols as string | string[]
      ).toString()}' is invalid.`,
    );
  }
  if (typeof protocols === 'string') {
    protocols = [protocols];
  }
  const uniq = protocols
    .map(p => ({ count: 1, protocol: p }))
    .reduce((a, b) => {
      a[b.protocol] = (a[b.protocol] || 0) + b.count;
      return a;
    }, {});
  const duplicates = Object.keys(uniq).filter(a => uniq[a] > 1);
  if (duplicates.length > 0) {
    throw new SyntaxError(
      `${ERROR_PREFIX.CONSTRUCTOR_ERROR} The subprotocol '${duplicates[0]}' is duplicated.`,
    );
  }
  return protocols.filter(p => p !== 'v1.kernel.websocket.jupyter.org');
}

function urlVerification(url: string | URL) {
  const urlRecord = new URL(url);
  const { pathname, protocol, hash } = urlRecord;
  if (!url) {
    throw new TypeError(
      `${ERROR_PREFIX.CONSTRUCTOR_ERROR} 1 argument required, but only 0 present.`,
    );
  }
  if (!pathname) {
    urlRecord.pathname = '/';
  }
  if (protocol === '') {
    throw new SyntaxError(
      `${
        ERROR_PREFIX.CONSTRUCTOR_ERROR
      } The URL '${urlRecord.toString()}' is invalid.`,
    );
  }
  if (protocol !== 'ws:' && protocol !== 'wss:') {
    throw new SyntaxError(
      `${ERROR_PREFIX.CONSTRUCTOR_ERROR} The URL's scheme must be either 'ws' or 'wss'. '${protocol}' is not allowed.`,
    );
  }
  if (hash !== '') {
    throw new SyntaxError(
      `${ERROR_PREFIX.CONSTRUCTOR_ERROR} The URL contains a fragment identifier ('${hash}'). Fragment identifiers are not allowed in WebSocket URLs.`,
    );
  }
  return urlRecord.toString();
}

/**
 * EventTarget is an interface implemented by objects that can
 * receive events and may have listeners for them.
 *
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
 */
class EventTarget {
  /** Map of event type to listener functions */
  protected listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  /*
   * Ties a listener function to an event type which can later be invoked via the
   * dispatchEvent method.
   *
   * @param {string} type - the type of event (ie: 'open', 'message', etc.)
   * @param {function} listener - callback function to invoke when an event is dispatched matching the type
   * @param {boolean} useCapture - N/A TODO: implement useCapture functionality
   */
  addEventListener(
    type: string,
    listener: (...args: any[]) => void /* , useCapture */,
  ) {
    if (typeof listener === 'function') {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }

      this.listeners.get(type)!.add(listener);
    }
  }

  /*
   * Removes the listener so it will no longer be invoked via the dispatchEvent method.
   *
   * @param {string} type - the type of event (ie: 'open', 'message', etc.)
   * @param {function} listener - callback function to invoke when an event is dispatched matching the type
   * @param {boolean} useCapture - N/A TODO: implement useCapture functionality
   */
  removeEventListener(
    type: string,
    listener: (...args: any[]) => void /* , useCapture */,
  ) {
    this.listeners.get(type)?.delete(listener);
  }

  /*
   * Invokes all listener functions that are listening to the given event.type property. Each
   * listener will be passed the event as the first argument.
   *
   * @param {object} event - event object which will be passed to all listeners of the event.type property
   */
  dispatchEvent(event: Event, ...customArguments) {
    const eventName = event.type;
    const listeners = this.listeners.get(eventName);
    if (!listeners) {
      return false;
    }
    listeners.forEach(listener => {
      if (customArguments.length > 0) {
        listener.apply(this, customArguments);
      } else {
        listener.call(this, event);
      }
    });
    return true;
  }
}

/**
 * Fake WebSocket implementation that proxies through postMessage.
 * Implements the standard WebSocket API but communicates with the VS Code extension
 * instead of directly connecting to a server.
 */
class WebSocket extends EventTarget {
  /** WebSocket is connecting */
  static readonly CONNECTING = 0;
  /** WebSocket connection is open and ready */
  static readonly OPEN = 1;
  /** WebSocket connection is closing */
  static readonly CLOSING = 2;
  /** WebSocket connection is closed */
  static readonly CLOSED = 3;
  /** Counter for generating unique client IDs */
  private static _clientCounter = 0;

  constructor(url: string | URL, protocols: string | string[] = []) {
    super();
    this.clientId = 'ws-' + (WebSocket._clientCounter++).toString();
    this.url = urlVerification(url);
    protocols = protocolVerification(protocols);
    this.protocol = protocols[0] || '';
    this.binaryType = 'blob';
    this._readyState = WebSocket.CONNECTING;
    this._disposable = MessageHandler.instance.registerCallback(
      this._onExtensionMessage.bind(this),
    );
    this._open();
  }

  /** Current connection state */
  private _readyState: number;
  /** Disposable for cleaning up message handlers */
  private _disposable: { dispose(): void };

  /** WebSocket is connecting */
  readonly CONNECTING = 0;
  /** WebSocket connection is open and ready */
  readonly OPEN = 1;
  /** WebSocket connection is closing */
  readonly CLOSING = 2;
  /** WebSocket connection is closed */
  readonly CLOSED = 3;

  /** Unique identifier for this WebSocket instance */
  readonly clientId: string;
  /** URL of the WebSocket endpoint */
  readonly url: string;
  /** Amount of buffered data waiting to be sent */
  readonly bufferedAmount: number;
  /** Extensions in use */
  readonly extensions: string;
  /** Subprotocol in use */
  readonly protocol: string;
  /** Binary data type for received messages */
  binaryType: BinaryType;

  get readyState(): number {
    return this._readyState;
  }

  get onopen() {
    return this.listeners.get('open') as any;
  }

  get onmessage() {
    return this.listeners.get('message') as any;
  }

  get onclose() {
    return this.listeners.get('close') as any;
  }

  get onerror() {
    return this.listeners.get('error') as any;
  }

  set onopen(listener: (...args: any[]) => void) {
    this.listeners.delete('open');
    this.addEventListener('open', listener);
  }

  set onmessage(listener: (...args: any[]) => void) {
    this.listeners.delete('message');
    this.addEventListener('message', listener);
  }

  set onclose(listener: (...args: any[]) => void) {
    this.listeners.delete('close');
    this.addEventListener('close', listener);
  }

  set onerror(listener: (...args: any[]) => void) {
    this.listeners.delete('error');
    this.addEventListener('error', listener);
  }

  close(code?: number, reason?: string) {
    if (code !== undefined) {
      if (
        typeof code !== 'number' ||
        (code !== 1000 && (code < 3000 || code > 4999))
      ) {
        throw new TypeError(
          `${ERROR_PREFIX.CLOSE_ERROR} The code must be either 1000, or between 3000 and 4999. ${code} is neither.`,
        );
      }
    }

    if (reason !== undefined) {
      const length = lengthInUtf8Bytes(reason);

      if (length > 123) {
        throw new SyntaxError(
          `${ERROR_PREFIX.CLOSE_ERROR} The message must not be greater than 123 bytes.`,
        );
      }
    }

    if (
      this.readyState === WebSocket.CLOSING ||
      this.readyState === WebSocket.CLOSED
    ) {
      return;
    }

    const wasConnecting = this.readyState === WebSocket.CONNECTING;
    this._readyState = WebSocket.CLOSING;
    this._disposable.dispose();
    const closeEvent = createCloseEvent({
      type: 'close',
      target: this,
      code,
      reason,
    });
    setTimeout(() => {
      MessageHandler.instance.postMessage({
        type: 'websocket-close',
        id: this.clientId,
        body: {
          origin: this.url,
        },
      });
      this._readyState = WebSocket.CLOSED;
      if (wasConnecting) {
        const errorEvent = createEvent({
          type: 'error',
          target: this,
        });
        this.dispatchEvent(errorEvent);
      }
      this.dispatchEvent(closeEvent);
    });
  }

  send(data) {
    if (
      this.readyState === WebSocket.CLOSING ||
      this.readyState === WebSocket.CLOSED
    ) {
      throw new Error('WebSocket is already in CLOSING or CLOSED state');
    }

    // TODO: handle bufferedAmount
    MessageHandler.instance.postMessage({
      type: 'websocket-message',
      id: this.clientId,
      body: {
        origin: this.url,
        data: normalizeSendData(data),
      },
    });
  }

  private _onExtensionMessage(message: ExtensionMessage): boolean {
    const { type, body, id } = message;
    if (id === this.clientId) {
      switch (type) {
        case 'websocket-message':
          // FIXME this does not work -> JupyterLab fails to deserialize the array
          // when the protocol is v1.kernel.websocket.jupyter.org
          // A part of the fix probably lies in the need to convert the binaryType
          // to 'arraybuffer' for kernel websocket (in the extension side!!):
          // https://github.com/jupyterlab/jupyterlab/blob/85c82eba1caa7e28a0d818c0840e13756c1b1256/packages/services/src/kernel/default.ts#L1468
          if (body.data.type === 'Buffer' && body.data.data) {
            body.data = new ArrayBuffer(body.data.data);
          }
          this.dispatchEvent(new MessageEvent('message', body));
          break;
        case 'websocket-open':
          this._readyState = WebSocket.OPEN;
          this.dispatchEvent(new Event('open'));
          break;
        case 'websocket-close':
          this.close();
          break;
      }
      return true;
    }
    return false;
  }

  private _open(): void {
    MessageHandler.instance.postMessage({
      type: 'websocket-open',
      id: this.clientId,
      body: {
        origin: this.url,
        protocol: this.protocol,
      },
    });
  }
}
