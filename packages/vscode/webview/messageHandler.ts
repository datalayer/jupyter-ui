/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
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
};

/**
 * Handle message from and to the extension
 */
export class MessageHandler {
  private _callbackCount = 0;
  private _messageCallbacks: Map<
    number,
    (message: ExtensionMessage) => void
  > = new Map();
  private static _requestCount = 0;
  private _pendingReplies: Map<string, PromiseDelegate<ExtensionMessage>> =
    new Map();

  constructor() {
    window.addEventListener('message', this._handleMessage.bind(this));
  }

  /**
   * Send message to the extension.
   *
   * @param message Message to send
   */
  postMessage(message: ExtensionMessage) {
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
   * @returns Unregister handler
   */
  registerCallback(
    handler: (message: ExtensionMessage) => void
  ): {
    dispose: () => void;
  } {
    const index = this._callbackCount++;
    this._messageCallbacks.set(index, handler);
    return Object.freeze({
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
        handler(message)
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
  MessageHandler.instance
);
