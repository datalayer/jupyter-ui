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
   * Message request ID.
   */
  requestId?: string;
};
