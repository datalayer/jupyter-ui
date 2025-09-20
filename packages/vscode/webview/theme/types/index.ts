/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/types
 * @description Type definitions for the extensible theme system.
 * Provides interfaces for theme providers, color palettes, and theme definitions.
 */

import { IDisposable } from '@lumino/disposable';

/**
 * Extended color modes supporting high contrast and auto-detection
 */
export type ColorMode =
  | 'light'
  | 'dark'
  | 'auto'
  | 'high-contrast-light'
  | 'high-contrast-dark';

/**
 * Theme provider types
 */
export type ThemeProviderType = 'jupyterlab' | 'vscode' | 'custom' | 'auto';

/**
 * Color palette interface for theme colors
 */
export interface IColorPalette {
  // Background colors
  'background.primary': string;
  'background.secondary': string;
  'background.tertiary': string;
  'background.overlay': string;

  // Text colors
  'text.primary': string;
  'text.secondary': string;
  'text.disabled': string;
  'text.link': string;

  // Border colors
  'border.default': string;
  'border.muted': string;
  'border.subtle': string;

  // Status colors
  'status.error': string;
  'status.warning': string;
  'status.success': string;
  'status.info': string;

  // Interactive colors
  'interactive.hover': string;
  'interactive.active': string;
  'interactive.focus': string;

  // Editor specific
  'editor.background': string;
  'editor.foreground': string;
  'editor.selectionBackground': string;
  'editor.lineHighlight': string;
  'editor.cursor': string;

  // Additional semantic colors
  [key: string]: string;
}

/**
 * Typography configuration
 */
export interface ITypography {
  fontFamily: {
    default: string;
    mono: string;
  };
  fontSize: {
    small: string;
    medium: string;
    large: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    bold: number;
  };
  lineHeight: {
    condensed: number;
    normal: number;
    relaxed: number;
  };
}

/**
 * Spacing configuration
 */
export interface ISpacing {
  unit: number;
  scale: number[];
}

/**
 * Complete theme definition
 */
export interface IThemeDefinition {
  id: string;
  name: string;
  colorMode: ColorMode;
  provider: ThemeProviderType;
  colors: Partial<IColorPalette>;
  typography?: Partial<ITypography>;
  spacing?: Partial<ISpacing>;
  cssVariables?: Record<string, string>;
}

/**
 * Primer theme mapping for compatibility with Primer React
 */
export interface IPrimerThemeMapping {
  colors: {
    canvas: {
      default: string;
      subtle: string;
      inset?: string;
    };
    fg: {
      default: string;
      muted: string;
      subtle?: string;
      onEmphasis?: string;
    };
    border: {
      default: string;
      muted?: string;
      subtle?: string;
    };
    [key: string]: any;
  };
  fonts?: {
    normal: string;
    mono: string;
  };
  fontSizes?: string[];
  space?: number[];
}

/**
 * Theme provider interface for implementing different theme sources
 */
export interface IThemeProvider {
  /**
   * Unique identifier for the provider
   */
  readonly id: string;

  /**
   * Display name for the provider
   */
  readonly name: string;

  /**
   * Get the current color mode
   */
  getColorMode(): ColorMode;

  /**
   * Get CSS variables for injection into the document
   */
  getCSSVariables(): Record<string, string>;

  /**
   * Map theme colors to Primer theme structure
   */
  mapToPrimer(): IPrimerThemeMapping;

  /**
   * Get the complete theme definition
   */
  getThemeDefinition(): IThemeDefinition;

  /**
   * Subscribe to theme changes
   */
  subscribeToChanges(callback: () => void): IDisposable;

  /**
   * Dispose of the provider
   */
  dispose(): void;
}

/**
 * Theme context value
 */
export interface IThemeContext {
  provider: IThemeProvider | null;
  theme: IThemeDefinition | null;
  colorMode: ColorMode;
  setProvider: (provider: IThemeProvider) => void;
  setColorMode: (mode: ColorMode) => void;
}
