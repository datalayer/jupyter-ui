/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/types
 * Type definitions for the extensible theme system.
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
  /** Primary background color */
  'background.primary': string;
  /** Secondary background color for panels */
  'background.secondary': string;
  /** Tertiary background color for nested elements */
  'background.tertiary': string;
  /** Overlay background color for popups */
  'background.overlay': string;

  /** Primary text color */
  'text.primary': string;
  /** Secondary text color for descriptions */
  'text.secondary': string;
  /** Disabled text color */
  'text.disabled': string;
  /** Link text color */
  'text.link': string;

  /** Default border color */
  'border.default': string;
  /** Muted border color */
  'border.muted': string;
  /** Subtle border color */
  'border.subtle': string;

  /** Error status color */
  'status.error': string;
  /** Warning status color */
  'status.warning': string;
  /** Success status color */
  'status.success': string;
  /** Info status color */
  'status.info': string;

  /** Hover state color */
  'interactive.hover': string;
  /** Active state color */
  'interactive.active': string;
  /** Focus state color */
  'interactive.focus': string;

  /** Editor background color */
  'editor.background': string;
  /** Editor foreground color */
  'editor.foreground': string;
  /** Editor selection background color */
  'editor.selectionBackground': string;
  /** Editor active line highlight color */
  'editor.lineHighlight': string;
  /** Editor cursor color */
  'editor.cursor': string;

  /** Additional semantic colors */
  [key: string]: string;
}

/**
 * Typography configuration
 */
export interface ITypography {
  /** Font family configuration */
  fontFamily: {
    /** Default font family for UI text */
    default: string;
    /** Monospace font family for code */
    mono: string;
  };
  /** Font size configuration */
  fontSize: {
    /** Small font size */
    small: string;
    /** Medium font size */
    medium: string;
    /** Large font size */
    large: string;
  };
  /** Font weight configuration */
  fontWeight: {
    /** Normal font weight */
    normal: number;
    /** Medium font weight */
    medium: number;
    /** Bold font weight */
    bold: number;
  };
  /** Line height configuration */
  lineHeight: {
    /** Condensed line height */
    condensed: number;
    /** Normal line height */
    normal: number;
    /** Relaxed line height */
    relaxed: number;
  };
}

/**
 * Spacing configuration
 */
export interface ISpacing {
  /** Base spacing unit in pixels */
  unit: number;
  /** Spacing scale array for consistent spacing */
  scale: number[];
}

/**
 * Complete theme definition
 */
export interface IThemeDefinition {
  /** Unique theme identifier */
  id: string;
  /** Display name of the theme */
  name: string;
  /** Color mode of the theme */
  colorMode: ColorMode;
  /** Theme provider type */
  provider: ThemeProviderType;
  /** Theme color palette */
  colors: Partial<IColorPalette>;
  /** Typography configuration */
  typography?: Partial<ITypography>;
  /** Spacing configuration */
  spacing?: Partial<ISpacing>;
  /** Custom CSS variables */
  cssVariables?: Record<string, string>;
}

/**
 * Primer theme mapping for compatibility with Primer React
 */
export interface IPrimerThemeMapping {
  /** Color configuration for Primer */
  colors: {
    /** Canvas (background) colors */
    canvas: {
      /** Default canvas color */
      default: string;
      /** Subtle canvas color */
      subtle: string;
      /** Inset canvas color */
      inset?: string;
    };
    /** Foreground (text) colors */
    fg: {
      /** Default foreground color */
      default: string;
      /** Muted foreground color */
      muted: string;
      /** Subtle foreground color */
      subtle?: string;
      /** Foreground on emphasis color */
      onEmphasis?: string;
    };
    /** Border colors */
    border: {
      /** Default border color */
      default: string;
      /** Muted border color */
      muted?: string;
      /** Subtle border color */
      subtle?: string;
    };
    /** Additional color properties */
    [key: string]: any;
  };
  /** Font configuration */
  fonts?: {
    /** Normal font family */
    normal: string;
    /** Monospace font family */
    mono: string;
  };
  /** Font size scale */
  fontSizes?: string[];
  /** Spacing scale */
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
  /** Current theme provider */
  provider: IThemeProvider | null;
  /** Current theme definition */
  theme: IThemeDefinition | null;
  /** Current color mode */
  colorMode: ColorMode;
  /** Set the theme provider */
  setProvider: (provider: IThemeProvider) => void;
  /** Set the color mode */
  setColorMode: (mode: ColorMode) => void;
}
