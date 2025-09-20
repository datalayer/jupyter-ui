/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/providers/BaseThemeProvider
 * @description Base implementation for theme providers.
 * Provides common functionality for all theme provider implementations.
 */

import { IDisposable } from '@lumino/disposable';
import {
  IThemeProvider,
  IThemeDefinition,
  ColorMode,
  IPrimerThemeMapping,
  ThemeProviderType,
} from '../types';

/**
 * Base theme provider implementation
 */
export abstract class BaseThemeProvider implements IThemeProvider {
  protected _disposed = false;
  protected _listeners: Set<() => void> = new Set();
  protected _colorMode: ColorMode = 'light';

  constructor(
    public readonly id: string,
    public readonly name: string,
    protected readonly providerType: ThemeProviderType,
  ) {}

  /**
   * Get the current color mode
   */
  getColorMode(): ColorMode {
    return this._colorMode;
  }

  /**
   * Get CSS variables for injection
   */
  abstract getCSSVariables(): Record<string, string>;

  /**
   * Map to Primer theme structure
   */
  abstract mapToPrimer(): IPrimerThemeMapping;

  /**
   * Get the complete theme definition
   */
  getThemeDefinition(): IThemeDefinition {
    return {
      id: this.id,
      name: this.name,
      colorMode: this._colorMode,
      provider: this.providerType,
      colors: this.getColors(),
      cssVariables: this.getCSSVariables(),
    };
  }

  /**
   * Get theme colors
   */
  protected abstract getColors(): any;

  /**
   * Subscribe to theme changes
   */
  subscribeToChanges(callback: () => void): IDisposable {
    this._listeners.add(callback);
    const disposable = {
      isDisposed: false,
      dispose: () => {
        if (!disposable.isDisposed) {
          this._listeners.delete(callback);
          disposable.isDisposed = true;
        }
      },
    };
    return disposable;
  }

  /**
   * Notify listeners of theme changes
   */
  protected notifyListeners(): void {
    this._listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error notifying theme listener:', error);
      }
    });
  }

  /**
   * Dispose of the provider
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._listeners.clear();
  }

  /**
   * Check if disposed
   */
  get isDisposed(): boolean {
    return this._disposed;
  }
}
