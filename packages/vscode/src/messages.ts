/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
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
};
