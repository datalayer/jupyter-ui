/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module messageHandler
 * Message handling service for webview-extension communication.
 * Manages bidirectional message passing between the webview and VS Code extension.
 */

import { PromiseDelegate } from '@lumino/coreutils';
import { createContext } from 'react';

declare let acquireVsCodeApi: any;

// Get access to the VS Code API from within the webview context. !!! this can only be called once.
const vscode = acquireVsCodeApi();

/**
 * Extension message
 */
export type ExtensionMessage = {
  /**
   * Message type.
   */
  type: string;
  /**
   * Message body.
   */
  body?: any;
  /**
   * Request reply error.
   */
  error?: any;
  /**
   * Message owner ID.
   *
   * For a HTTP request this is a request ID, for a websocket message
   * it is the client ID.
   */
  id?: string;
  /**
   * Request ID for matching responses to requests.
   */
  requestId?: string;
};

/**
 * Handle message from and to the extension
 */
export class MessageHandler {
  /** Counter for generating unique callback IDs */
  private _callbackCount = 0;
  /** Map of callback ID to message handler functions */
  private _messageCallbacks: Map<number, (message: ExtensionMessage) => void> =
    new Map();
  /** Counter for generating unique request IDs */
  private static _requestCount = 0;
  /** Map of pending request IDs to promise delegates */
  private _pendingReplies: Map<string, PromiseDelegate<ExtensionMessage>> =
    new Map();

  /**
   * Creates a new MessageHandler instance
   */
  constructor() {
    window.addEventListener('message', this._handleMessage.bind(this));
  }

  /**
   * Send message to the extension.
   *
   * @param message Message to send
   */
  postMessage(message: ExtensionMessage) {
    console.log('[MessageHandler] Sending message to extension:', {
      type: message.type,
      hasBody: !!message.body,
      bodyKeys: message.body ? Object.keys(message.body) : undefined,
      id: message.id,
    });
    vscode.postMessage(message);
  }

  /**
   * Send a request to the extension.
   *
   * @param message Request
   * @returns Reply
   */
  async postRequest(message: ExtensionMessage): Promise<ExtensionMessage> {
    const requestId = 'request-' + (MessageHandler._requestCount++).toString();
    const promise = new PromiseDelegate<ExtensionMessage>();
    this._pendingReplies.set(requestId, promise);
    message.id = requestId;
    this.postMessage(message);
    return promise.promise;
  }

  /**
   * Register a callback on incoming messages.
   *
   * Note:
   * The callback won't be called when the message is a reply to a request.
   *
   * @param handler Incoming message handler
   * @returns Object with dispose method to unregister the handler
   */
  registerCallback(handler: (message: ExtensionMessage) => void): {
    /** Unregister the callback handler */
    dispose: () => void;
  } {
    const index = this._callbackCount++;
    this._messageCallbacks.set(index, handler);
    return Object.freeze({
      /**
       * Dispose the callback handler
       */
      dispose: () => {
        this._messageCallbacks.delete(index);
      },
    });
  }

  private _handleMessage(event: MessageEvent<ExtensionMessage>): void {
    const message = event.data;
    if (message.id) {
      const pendingReply = this._pendingReplies.get(message.id);
      if (pendingReply) {
        if (message.error) {
          pendingReply?.reject(message.error);
        } else {
          pendingReply?.resolve(message);
        }
        return;
      }
    }

    for (const handler of this._messageCallbacks.values()) {
      try {
        handler(message);
      } catch (reason) {
        console.error('Failed to handle message: ', reason);
      }
    }
  }

  /**
   * Static singleton instance of {@link MessageHandler}.
   */
  static instance = new MessageHandler();
}

/**
 * Singleton {@link MessageHandler} instance as React context.
 */
export const MessageHandlerContext = createContext<MessageHandler>(
  MessageHandler.instance,
);
