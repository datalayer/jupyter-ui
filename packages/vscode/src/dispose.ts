/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module dispose
 * Disposable utility classes for resource management.
 * Implements the disposable pattern for proper cleanup of resources.
 */

import type * as vscode from 'vscode';

/**
 * Disposes of all items in the disposables array.
 * @param {vscode.Disposable[]} disposables - Array of disposables to clean up
 */
export function disposeAll(disposables: vscode.Disposable[]): void {
  while (disposables.length) {
    const item = disposables.pop();
    if (item) {
      item.dispose();
    }
  }
}

/**
 * Abstract base class for implementing the disposable pattern.
 * Manages a collection of child disposables and ensures proper cleanup.
 * @abstract
 * @class Disposable
 */
export abstract class Disposable {
  /** Whether this instance has been disposed */
  private _isDisposed = false;
  /** Collection of child disposables to clean up */
  protected _disposables: vscode.Disposable[] = [];

  /**
   * Disposes of this instance and all registered disposables.
   */
  public dispose() {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    disposeAll(this._disposables);
  }

  /**
   * Registers a disposable to be cleaned up when this instance is disposed.
   * @param {T} value - The disposable to register
   * @returns {T} The registered disposable
   * @template T
   */
  protected _register<T extends vscode.Disposable>(value: T): T {
    if (this._isDisposed) {
      value.dispose();
    } else {
      this._disposables.push(value);
    }
    return value;
  }

  /**
   * Gets whether this instance has been disposed.
   * @returns {boolean} True if disposed, false otherwise
   */
  protected get isDisposed(): boolean {
    return this._isDisposed;
  }
}
