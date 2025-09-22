/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module util
 * General utility functions for the extension.
 * Provides helper functions used throughout the extension codebase.
 */

/**
 * Generates a cryptographically random nonce string for CSP headers.
 * @returns {string} A 32-character random string
 */
export function getNonce() {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
