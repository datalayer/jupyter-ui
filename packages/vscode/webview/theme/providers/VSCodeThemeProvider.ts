/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/providers/VSCodeThemeProvider
 * @description VS Code theme provider implementation.
 * Extracts and maps VS Code theme colors to the unified theme system.
 */

import { BaseThemeProvider } from './BaseThemeProvider';
import { ColorMode, IPrimerThemeMapping, IColorPalette } from '../types';

/**
 * VS Code theme provider
 */
export class VSCodeThemeProvider extends BaseThemeProvider {
  private _vscodeColors: Map<string, string> = new Map();
  private _observer: MutationObserver | null = null;

  constructor(colorMode: ColorMode = 'light') {
    super('vscode-theme', 'VS Code Theme', 'vscode');
    this._colorMode = colorMode;

    console.log(
      '[VSCodeThemeProvider] Initializing with color mode:',
      colorMode,
    );

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.detectVSCodeColors();
        this.observeThemeChanges();
      });
    } else {
      // DOM is already ready
      this.detectVSCodeColors();
      this.observeThemeChanges();
    }
  }

  /**
   * Detect and extract VS Code theme colors from CSS variables
   */
  private detectVSCodeColors(): void {
    this._vscodeColors.clear();

    // Get computed styles from multiple sources
    const rootStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);

    // Try to get from inline styles first (VS Code often injects here)
    const inlineStyles = document.documentElement.style;

    // Check inline style properties
    for (let i = 0; i < inlineStyles.length; i++) {
      const prop = inlineStyles[i];
      if (prop.startsWith('--vscode-')) {
        const value = inlineStyles.getPropertyValue(prop);
        if (value) {
          this._vscodeColors.set(prop, value.trim());
        }
      }
    }

    // Also check computed styles for VS Code variables
    // This is a more thorough check
    const allVSCodeVars = [
      '--vscode-editor-background',
      '--vscode-editor-foreground',
      '--vscode-editorWidget-background',
      '--vscode-editorWidget-foreground',
      '--vscode-editorWidget-border',
      '--vscode-input-background',
      '--vscode-input-foreground',
      '--vscode-input-border',
      '--vscode-inputOption-activeBackground',
      '--vscode-inputOption-activeForeground',
      '--vscode-inputOption-activeBorder',
      '--vscode-dropdown-background',
      '--vscode-dropdown-foreground',
      '--vscode-dropdown-border',
      '--vscode-list-hoverBackground',
      '--vscode-list-hoverForeground',
      '--vscode-list-activeSelectionBackground',
      '--vscode-list-activeSelectionForeground',
      '--vscode-list-inactiveSelectionBackground',
      '--vscode-list-inactiveSelectionForeground',
      '--vscode-button-background',
      '--vscode-button-foreground',
      '--vscode-button-hoverBackground',
      '--vscode-button-secondaryBackground',
      '--vscode-button-secondaryForeground',
      '--vscode-button-secondaryHoverBackground',
      '--vscode-badge-background',
      '--vscode-badge-foreground',
      '--vscode-scrollbar-shadow',
      '--vscode-scrollbarSlider-background',
      '--vscode-scrollbarSlider-hoverBackground',
      '--vscode-scrollbarSlider-activeBackground',
      '--vscode-progressBar-background',
      '--vscode-editor-font-family',
      '--vscode-editor-font-size',
      '--vscode-editor-font-weight',
      '--vscode-editor-lineHeight',
      '--vscode-terminal-ansiBlack',
      '--vscode-terminal-ansiRed',
      '--vscode-terminal-ansiGreen',
      '--vscode-terminal-ansiYellow',
      '--vscode-terminal-ansiBlue',
      '--vscode-terminal-ansiMagenta',
      '--vscode-terminal-ansiCyan',
      '--vscode-terminal-ansiWhite',
      '--vscode-errorForeground',
      '--vscode-descriptionForeground',
      '--vscode-textLink-foreground',
      '--vscode-textLink-activeForeground',
      '--vscode-textBlockQuote-background',
      '--vscode-textBlockQuote-border',
      '--vscode-textCodeBlock-background',
      '--vscode-sideBar-background',
      '--vscode-sideBar-foreground',
      '--vscode-sideBar-border',
      '--vscode-panel-background',
      '--vscode-panel-border',
      '--vscode-panelTitle-activeForeground',
      '--vscode-panelTitle-inactiveForeground',
      '--vscode-panelTitle-activeBorder',
      '--vscode-statusBar-background',
      '--vscode-statusBar-foreground',
      '--vscode-statusBar-border',
      '--vscode-titleBar-activeBackground',
      '--vscode-titleBar-activeForeground',
      '--vscode-titleBar-inactiveBackground',
      '--vscode-titleBar-inactiveForeground',
      '--vscode-notifications-background',
      '--vscode-notifications-foreground',
      '--vscode-notifications-border',
      '--vscode-notificationCenterHeader-background',
      '--vscode-notificationCenterHeader-foreground',
      '--vscode-notificationsErrorIcon-foreground',
      '--vscode-notificationsWarningIcon-foreground',
      '--vscode-notificationsInfoIcon-foreground',
    ];

    allVSCodeVars.forEach(varName => {
      // Try root styles first
      let value = rootStyles.getPropertyValue(varName);
      if (!value) {
        // Try body styles
        value = bodyStyles.getPropertyValue(varName);
      }
      if (value && value.trim()) {
        this._vscodeColors.set(varName, value.trim());
      }
    });

    // Log what we found for debugging
    console.log('[VSCodeThemeProvider] Detected VS Code colors:', {
      count: this._vscodeColors.size,
      sample: Array.from(this._vscodeColors.entries()).slice(0, 5),
      editorBg: this._vscodeColors.get('--vscode-editor-background'),
      editorFg: this._vscodeColors.get('--vscode-editor-foreground'),
    });
  }

  /**
   * Observe DOM changes to detect theme switches
   */
  private observeThemeChanges(): void {
    // Observe DOM mutations
    this._observer = new MutationObserver(() => {
      const oldSize = this._vscodeColors.size;
      const oldBg = this._vscodeColors.get('--vscode-editor-background');

      this.detectVSCodeColors();

      const newBg = this._vscodeColors.get('--vscode-editor-background');

      // Check if theme actually changed
      if (
        oldBg !== newBg ||
        oldSize !== this._vscodeColors.size ||
        this.detectColorModeChange()
      ) {
        console.log(
          '[VSCodeThemeProvider] Theme change detected via MutationObserver',
        );
        this.notifyListeners();
      }
    });

    this._observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false,
    });

    // Also observe body for style changes
    this._observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      subtree: false,
    });
  }

  /**
   * Force refresh the theme
   */
  public refresh(): void {
    console.log('[VSCodeThemeProvider] Force refresh triggered');
    this.detectVSCodeColors();
    this.detectColorModeChange();
    this.notifyListeners();
  }

  /**
   * Detect if color mode changed based on background color
   */
  private detectColorModeChange(): boolean {
    const bgColor = this._vscodeColors.get('--vscode-editor-background');
    if (bgColor) {
      // Simple heuristic: parse RGB and check luminance
      const rgb = this.parseColor(bgColor);
      if (rgb) {
        const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
        const newMode = luminance > 0.5 ? 'light' : 'dark';
        if (newMode !== this._colorMode) {
          this._colorMode = newMode;
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(
    color: string,
  ): { r: number; g: number; b: number } | null {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      if (hex.length === 3) {
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else if (hex.length === 6) {
        return {
          r: parseInt(hex.slice(0, 2), 16),
          g: parseInt(hex.slice(2, 4), 16),
          b: parseInt(hex.slice(4, 6), 16),
        };
      }
    }

    // Handle rgb/rgba colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
      };
    }

    return null;
  }

  /**
   * Get VS Code color or fallback
   */
  private getVSCodeColor(varName: string, fallback: string): string {
    const value = this._vscodeColors.get(varName);
    // If we have the value, use it directly or as a CSS variable
    if (value) {
      // Return the actual value, not wrapped in var()
      return value;
    }
    // Try to get it from computed styles as a fallback
    const computed = getComputedStyle(
      document.documentElement,
    ).getPropertyValue(varName);
    if (computed && computed.trim()) {
      return computed.trim();
    }
    // Final fallback
    return fallback;
  }

  /**
   * Get theme colors mapped from VS Code
   */
  protected getColors(): Partial<IColorPalette> {
    return {
      'background.primary': this.getVSCodeColor(
        '--vscode-editor-background',
        '#ffffff',
      ),
      'background.secondary': this.getVSCodeColor(
        '--vscode-sideBar-background',
        '#f6f8fa',
      ),
      'background.tertiary': this.getVSCodeColor(
        '--vscode-panel-background',
        '#f6f8fa',
      ),
      'background.overlay': this.getVSCodeColor(
        '--vscode-dropdown-background',
        '#ffffff',
      ),

      'text.primary': this.getVSCodeColor(
        '--vscode-editor-foreground',
        '#24292e',
      ),
      'text.secondary': this.getVSCodeColor(
        '--vscode-descriptionForeground',
        '#586069',
      ),
      'text.disabled': this.getVSCodeColor(
        '--vscode-disabledForeground',
        '#6a737d',
      ),
      'text.link': this.getVSCodeColor(
        '--vscode-textLink-foreground',
        '#0366d6',
      ),

      'border.default': this.getVSCodeColor('--vscode-panel-border', '#e1e4e8'),
      'border.muted': this.getVSCodeColor(
        '--vscode-editorWidget-border',
        '#e1e4e8',
      ),
      'border.subtle': this.getVSCodeColor('--vscode-widget-border', '#d1d5da'),

      'status.error': this.getVSCodeColor(
        '--vscode-errorForeground',
        '#cb2431',
      ),
      'status.warning': this.getVSCodeColor(
        '--vscode-editorWarning-foreground',
        '#f9c513',
      ),
      'status.success': this.getVSCodeColor(
        '--vscode-terminal-ansiGreen',
        '#28a745',
      ),
      'status.info': this.getVSCodeColor(
        '--vscode-terminal-ansiBlue',
        '#0366d6',
      ),

      'interactive.hover': this.getVSCodeColor(
        '--vscode-list-hoverBackground',
        '#f6f8fa',
      ),
      'interactive.active': this.getVSCodeColor(
        '--vscode-list-activeSelectionBackground',
        '#e1e4e8',
      ),
      'interactive.focus': this.getVSCodeColor(
        '--vscode-focusBorder',
        '#0366d6',
      ),

      'editor.background': this.getVSCodeColor(
        '--vscode-editor-background',
        '#ffffff',
      ),
      'editor.foreground': this.getVSCodeColor(
        '--vscode-editor-foreground',
        '#24292e',
      ),
      'editor.selectionBackground': this.getVSCodeColor(
        '--vscode-editor-selectionBackground',
        '#add6ff',
      ),
      'editor.lineHighlight': this.getVSCodeColor(
        '--vscode-editor-lineHighlightBackground',
        '#f6f8fa',
      ),
      'editor.cursor': this.getVSCodeColor(
        '--vscode-editorCursor-foreground',
        '#24292e',
      ),
    };
  }

  /**
   * Get CSS variables for injection
   */
  getCSSVariables(): Record<string, string> {
    const colors = this.getColors();
    const variables: Record<string, string> = {};

    // Map semantic colors to CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      if (value) {
        const cssVarName = `--theme-${key.replace(/\./g, '-')}`;
        variables[cssVarName] = value;
      }
    });

    // Map to JupyterLab variables for compatibility
    variables['--jp-layout-color0'] = colors['background.primary'] || '';
    variables['--jp-layout-color1'] = colors['background.secondary'] || '';
    variables['--jp-layout-color2'] = colors['background.tertiary'] || '';
    variables['--jp-ui-font-color1'] = colors['text.primary'] || '';
    variables['--jp-ui-font-color2'] = colors['text.secondary'] || '';
    variables['--jp-border-color1'] = colors['border.default'] || '';
    variables['--jp-border-color2'] = colors['border.muted'] || '';

    // Typography
    variables['--jp-ui-font-family'] = this.getVSCodeColor(
      '--vscode-editor-font-family',
      'sans-serif',
    );
    variables['--jp-code-font-family'] = this.getVSCodeColor(
      '--vscode-editor-font-family',
      'monospace',
    );
    variables['--jp-ui-font-size1'] = this.getVSCodeColor(
      '--vscode-editor-font-size',
      '13px',
    );

    return variables;
  }

  /**
   * Map to Primer theme structure
   */
  mapToPrimer(): IPrimerThemeMapping {
    const colors = this.getColors();

    return {
      colors: {
        canvas: {
          default: colors['background.primary'] || '#ffffff',
          subtle: colors['background.secondary'] || '#f6f8fa',
          inset: colors['background.tertiary'] || '#f6f8fa',
        },
        fg: {
          default: colors['text.primary'] || '#24292e',
          muted: colors['text.secondary'] || '#586069',
          subtle: colors['text.disabled'] || '#6a737d',
          onEmphasis: '#ffffff',
        },
        border: {
          default: colors['border.default'] || '#e1e4e8',
          muted: colors['border.muted'] || '#e1e4e8',
          subtle: colors['border.subtle'] || '#d1d5da',
        },
        accent: {
          fg: colors['text.link'] || '#0366d6',
          emphasis: colors['text.link'] || '#0366d6',
          muted: colors['interactive.hover'] || '#f6f8fa',
          subtle: colors['interactive.active'] || '#e1e4e8',
        },
        success: {
          fg: colors['status.success'] || '#28a745',
          emphasis: colors['status.success'] || '#28a745',
        },
        danger: {
          fg: colors['status.error'] || '#cb2431',
          emphasis: colors['status.error'] || '#cb2431',
        },
        attention: {
          fg: colors['status.warning'] || '#f9c513',
          emphasis: colors['status.warning'] || '#f9c513',
        },
        neutral: {
          emphasisPlus: '#24292e',
          emphasis: '#586069',
          muted: 'rgba(110, 118, 129, 0.4)',
          subtle: '#f6f8fa',
        },
      },
      fonts: {
        normal: this.getVSCodeColor(
          '--vscode-editor-font-family',
          'sans-serif',
        ),
        mono: this.getVSCodeColor('--vscode-editor-font-family', 'monospace'),
      },
    };
  }

  /**
   * Dispose of the provider
   */
  dispose(): void {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    super.dispose();
  }
}
