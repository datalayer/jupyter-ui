/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module messages
 * Message type definitions for extension-webview communication.
 * Defines the protocol for messages exchanged between the extension and webview.
 */

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
