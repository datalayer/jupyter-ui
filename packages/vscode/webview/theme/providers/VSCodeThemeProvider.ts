/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/providers/VSCodeThemeProvider
 * VS Code theme provider implementation.
 * Extracts and maps VS Code theme colors to the unified theme system.
 */

import { BaseThemeProvider } from './BaseThemeProvider';
import { ColorMode, IPrimerThemeMapping, IColorPalette } from '../types';

/**
 * VS Code theme provider
 */
export class VSCodeThemeProvider extends BaseThemeProvider {
  /** Map of VS Code CSS variables to their values */
  private _vscodeColors: Map<string, string> = new Map();
  /** Mutation observer for theme changes */
  private _observer: MutationObserver | null = null;

  /**
   * Creates a new VSCodeThemeProvider
   * @param colorMode Initial color mode
   */
  constructor(colorMode: ColorMode = 'light') {
    super('vscode-theme', 'VS Code Theme', 'vscode');
    this._colorMode = colorMode;

    console.log(
      '[VSCodeThemeProvider] Initializing with color mode:',
      colorMode,
    );

    // Expose the provider globally for the patch to access
    if (typeof window !== 'undefined') {
      (window as any).__vscodeThemeProvider = this;
    }

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
      '--vscode-editorCodeLens-foreground',
      '--vscode-editorLineNumber-foreground',
      '--vscode-editorLineNumber-activeForeground',
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
      // TextMate token colors for syntax highlighting
      '--vscode-textmate-keyword-foreground',
      '--vscode-textmate-string-foreground',
      '--vscode-textmate-comment-foreground',
      '--vscode-textmate-function-foreground',
      '--vscode-textmate-variable-foreground',
      '--vscode-textmate-constant-foreground',
      '--vscode-textmate-type-foreground',
      '--vscode-textmate-class-foreground',
      '--vscode-textmate-number-foreground',
      '--vscode-textmate-regexp-foreground',
      '--vscode-textmate-operator-foreground',
      // Token colors used by VS Code
      '--vscode-editor-foreground',
      '--vscode-editor-selectionForeground',
      '--vscode-editor-inactiveSelectionForeground',
      '--vscode-editor-findMatchForeground',
      '--vscode-editor-findRangeHighlightForeground',
      '--vscode-editor-hoverHighlightForeground',
      '--vscode-editor-lineHighlightForeground',
      '--vscode-editor-rangeHighlightForeground',
      '--vscode-editor-symbolHighlightForeground',
      '--vscode-editor-wordHighlightForeground',
      '--vscode-editor-wordHighlightStrongForeground',
      '--vscode-editorBracketMatch-foreground',
      '--vscode-editorCodeLens-foreground',
      '--vscode-editorLink-activeForeground',
      '--vscode-editorWhitespace-foreground',
      // Notebook specific colors
      '--vscode-notebook-cellBorderColor',
      '--vscode-notebook-cellInsertionIndicator',
      '--vscode-notebook-cellStatusBarItemHoverBackground',
      '--vscode-notebook-cellToolbarSeparator',
      '--vscode-notebook-cellHoverBackground',
      '--vscode-notebook-selectedCellBackground',
      '--vscode-notebook-selectedCellBorder',
      '--vscode-notebook-focusedEditorBorder',
      '--vscode-notebook-inactiveFocusedCellBorder',
      '--vscode-notebook-inactiveSelectedCellBorder',
      '--vscode-notebook-outputContainerBackgroundColor',
      '--vscode-notebook-outputContainerBorderColor',
      '--vscode-notebook-cellEditorBackground',
      '--vscode-notebook-editorBackground',
      // Additional VS Code variables that might be used for cell borders
      '--vscode-notebook-focusedCellBorder',
      '--vscode-notebook-cellBorderColorFocused',
      '--vscode-notebookScrollbarSlider-activeBackground',
      '--vscode-notebookScrollbarSlider-background',
      '--vscode-notebookScrollbarSlider-hoverBackground',
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
    // Force syntax color extraction after a delay to ensure Monaco has loaded
    setTimeout(() => {
      this.notifyListeners();
    }, 100);
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
   * Lighten or darken a color by a percentage
   */
  private lightenDarkenColor(color: string, amount: number): string {
    const rgb = this.parseColor(color);
    if (!rgb) return color;

    // Adjust each component
    const adjust = (value: number) => {
      if (amount > 0) {
        // Lighten
        return Math.min(255, value + (255 - value) * (amount / 100));
      } else {
        // Darken
        return Math.max(0, value + value * (amount / 100));
      }
    };

    const r = Math.round(adjust(rgb.r));
    const g = Math.round(adjust(rgb.g));
    const b = Math.round(adjust(rgb.b));

    // Return as hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Extract syntax highlighting colors from VS Code theme
   *
   * Uses VS Code's actual syntax colors when available, falls back to defaults.
   * Maps VS Code debug token expression colors to CodeMirror syntax highlighting classes.
   * This ensures the notebook's syntax highlighting matches VS Code's active theme exactly.
   *
   * @returns Map of syntax token types to color values (e.g., 'keyword' -> '#C586C0')
   * @example
   * ```typescript
   * const colors = provider.extractSyntaxColors();
   * console.log(colors.get('keyword')); // '#C586C0' for dark themes
   * ```
   */
  public extractSyntaxColors(): Map<string, string> {
    const syntaxColors = new Map<string, string>();
    const isDark = this._colorMode === 'dark';

    // Try to extract actual syntax colors from VS Code CSS variables
    // VS Code doesn't directly expose syntax token colors as CSS variables
    // We need to use the available semantic colors and make educated guesses
    const tokenColorMappings = [
      { key: 'keyword', vscodeVar: '--vscode-debugTokenExpression-name' },
      { key: 'string', vscodeVar: '--vscode-debugTokenExpression-string' },
      { key: 'comment', vscodeVar: '--vscode-editor-foreground', darken: 40 },
      { key: 'function', vscodeVar: '--vscode-debugTokenExpression-value' },
      { key: 'number', vscodeVar: '--vscode-debugTokenExpression-number' },
      { key: 'variable', vscodeVar: '--vscode-debugTokenExpression-name' },
      { key: 'type', vscodeVar: '--vscode-debugTokenExpression-type' },
      { key: 'class', vscodeVar: '--vscode-symbolIcon-classForeground' },
      { key: 'constant', vscodeVar: '--vscode-symbolIcon-constantForeground' },
      { key: 'operator', vscodeVar: '--vscode-editor-foreground' },
    ];

    // Extract colors from VS Code variables
    tokenColorMappings.forEach(({ key, vscodeVar, darken }) => {
      let color = this._vscodeColors.get(vscodeVar);
      if (color && darken) {
        // Apply darkening/lightening for certain tokens
        color = this.lightenDarkenColor(color, isDark ? -darken : darken);
      }
      if (color) {
        syntaxColors.set(key, color);
      }
    });

    // Provide sensible defaults for any missing colors
    const defaults = isDark
      ? {
          keyword: '#C586C0',
          string: '#CE9178',
          comment: '#6A9955',
          function: '#DCDCAA',
          number: '#B5CEA8',
          variable: '#9CDCFE',
          type: '#4EC9B0',
          class: '#4EC9B0',
          constant: '#569CD6',
          operator: '#D4D4D4',
          default: '#D4D4D4',
        }
      : {
          keyword: '#0000FF',
          string: '#A31515',
          comment: '#008000',
          function: '#795E26',
          number: '#098658',
          variable: '#001080',
          type: '#267F99',
          class: '#267F99',
          constant: '#0070C1',
          operator: '#000000',
          default: '#000000',
        };

    // Apply defaults for any missing colors
    Object.entries(defaults).forEach(([key, value]) => {
      if (!syntaxColors.has(key)) {
        syntaxColors.set(key, value);
      }
    });

    console.log('[VSCodeThemeProvider] Extracted syntax colors:', syntaxColors);
    return syntaxColors;
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

    // IMPORTANT: Also set the base CodeMirror colors
    variables['--jp-content-font-color1'] =
      colors['editor.foreground'] || colors['text.primary'] || '';

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

    // Extract syntax highlighting colors from VS Code
    const syntaxColors = this.extractSyntaxColors();

    // CodeMirror specific colors - map them correctly to VS Code's syntax highlighting
    // The mapping is critical for matching VS Code's appearance

    // Keywords (import, def, class, if, for, etc.) - usually purple in dark themes
    variables['--jp-mirror-editor-keyword-color'] =
      syntaxColors.get('keyword') ||
      (this._colorMode === 'dark' ? '#C586C0' : '#0000FF');

    // Strings - usually orange/brown in dark themes
    variables['--jp-mirror-editor-string-color'] =
      syntaxColors.get('string') ||
      (this._colorMode === 'dark' ? '#CE9178' : '#A31515');

    // String 2 (template strings, regex)
    variables['--jp-mirror-editor-string-2-color'] =
      syntaxColors.get('string.regexp') ||
      syntaxColors.get('string') ||
      (this._colorMode === 'dark' ? '#D16969' : '#811F3F');

    // Comments - usually green in dark themes
    variables['--jp-mirror-editor-comment-color'] =
      syntaxColors.get('comment') ||
      (this._colorMode === 'dark' ? '#6A9955' : '#008000');

    // Numbers - usually light green in dark themes
    variables['--jp-mirror-editor-number-color'] =
      syntaxColors.get('number') ||
      (this._colorMode === 'dark' ? '#B5CEA8' : '#098658');

    // Functions and methods (print, node, system) - usually yellow in dark themes
    variables['--jp-mirror-editor-def-color'] =
      syntaxColors.get('function') ||
      (this._colorMode === 'dark' ? '#DCDCAA' : '#795E26');

    // Variables and identifiers
    variables['--jp-mirror-editor-variable-color'] =
      syntaxColors.get('variable') ||
      (this._colorMode === 'dark' ? '#9CDCFE' : '#001080');

    // Variable 2 (special variables, this, self)
    variables['--jp-mirror-editor-variable-2-color'] =
      syntaxColors.get('variable') ||
      (this._colorMode === 'dark' ? '#9CDCFE' : '#001080');

    // Variable 3 (types, classes when used as types)
    variables['--jp-mirror-editor-variable-3-color'] =
      syntaxColors.get('type') ||
      syntaxColors.get('class') ||
      (this._colorMode === 'dark' ? '#4EC9B0' : '#267F99');

    // Operators
    variables['--jp-mirror-editor-operator-color'] =
      syntaxColors.get('operator') ||
      colors['editor.foreground'] ||
      (this._colorMode === 'dark' ? '#D4D4D4' : '#000000');

    // Builtins (True, False, None, built-in functions)
    variables['--jp-mirror-editor-builtin-color'] =
      syntaxColors.get('constant') ||
      (this._colorMode === 'dark' ? '#569CD6' : '#0000FF');

    // Atoms (booleans, null, undefined)
    variables['--jp-mirror-editor-atom-color'] =
      syntaxColors.get('constant') ||
      (this._colorMode === 'dark' ? '#569CD6' : '#0070C1');

    // Meta (decorators, annotations)
    variables['--jp-mirror-editor-meta-color'] =
      syntaxColors.get('namespace') ||
      (this._colorMode === 'dark' ? '#C586C0' : '#795E26');

    // Qualifiers (module names in imports)
    variables['--jp-mirror-editor-qualifier-color'] =
      syntaxColors.get('namespace') ||
      syntaxColors.get('type') ||
      (this._colorMode === 'dark' ? '#4EC9B0' : '#267F99');

    // Tags (HTML/XML tags)
    variables['--jp-mirror-editor-tag-color'] =
      syntaxColors.get('function') ||
      (this._colorMode === 'dark' ? '#569CD6' : '#800000');

    // Attributes (HTML attributes, object properties)
    variables['--jp-mirror-editor-attribute-color'] =
      syntaxColors.get('member') ||
      syntaxColors.get('variable') ||
      (this._colorMode === 'dark' ? '#9CDCFE' : '#001080');

    // Properties (object properties, methods)
    variables['--jp-mirror-editor-property-color'] =
      syntaxColors.get('member') ||
      syntaxColors.get('function') ||
      (this._colorMode === 'dark' ? '#DCDCAA' : '#795E26');

    // Headers (markdown headers)
    variables['--jp-mirror-editor-header-color'] =
      syntaxColors.get('macro') ||
      (this._colorMode === 'dark' ? '#569CD6' : '#0000FF');

    // Quotes (blockquotes)
    variables['--jp-mirror-editor-quote-color'] =
      syntaxColors.get('string') ||
      (this._colorMode === 'dark' ? '#CE9178' : '#098658');

    // Links
    variables['--jp-mirror-editor-link-color'] =
      colors['text.link'] ||
      (this._colorMode === 'dark' ? '#61AFEF' : '#0366D6');

    // Errors
    variables['--jp-mirror-editor-error-color'] =
      colors['status.error'] ||
      (this._colorMode === 'dark' ? '#F44747' : '#CD3131');

    // Horizontal rules
    variables['--jp-mirror-editor-hr-color'] =
      colors['border.default'] ||
      (this._colorMode === 'dark' ? '#555555' : '#999999');

    // Brackets
    variables['--jp-mirror-editor-bracket-color'] =
      syntaxColors.get('operator') ||
      colors['editor.foreground'] ||
      (this._colorMode === 'dark' ? '#FFD700' : '#000000');

    // Additional critical editor colors
    variables['--jp-cell-editor-background'] =
      colors['editor.background'] || '#ffffff';
    variables['--jp-cell-editor-border-color'] =
      colors['border.default'] || '#e0e0e0';
    variables['--jp-cell-editor-active-background'] = this.getVSCodeColor(
      '--vscode-editor-lineHighlightBackground',
      '#f0f0f0',
    );

    // Code cell specific
    variables['--jp-code-font-color'] =
      colors['editor.foreground'] || colors['text.primary'] || '#000000';
    variables['--jp-code-cursor-color'] = colors['editor.cursor'] || '#000000';

    // Notebook cell styling - match VS Code notebook appearance
    const notebookBg = this.getVSCodeColor(
      '--vscode-notebook-editorBackground',
      colors['background.primary'] || '#ffffff',
    );
    const cellBg = this.getVSCodeColor(
      '--vscode-notebook-cellEditorBackground',
      colors['editor.background'] || '#ffffff',
    );

    // Extract the actual notebook border colors from VS Code
    // VS Code uses the focusedEditorBorder for active cells, which often matches the theme accent color
    let cellBorder = this.getVSCodeColor(
      '--vscode-notebook-cellBorderColor',
      '',
    );
    const focusedCellBorder = this.getVSCodeColor(
      '--vscode-notebook-focusedEditorBorder',
      this.getVSCodeColor(
        '--vscode-focusBorder',
        colors['interactive.focus'] || '#0366d6',
      ),
    );

    // For the red theme, the border should be red - use the focused border as the main border
    if (!cellBorder || cellBorder === 'transparent' || cellBorder === '') {
      // Try to get the focus border color which usually matches the theme
      cellBorder = this.getVSCodeColor(
        '--vscode-notebook-focusedCellBorder',
        '',
      );
      if (!cellBorder || cellBorder === 'transparent' || cellBorder === '') {
        // Use the focus border as the cell border for themed appearance
        cellBorder = focusedCellBorder;
      }
    }

    const selectedCellBg = this.getVSCodeColor(
      '--vscode-notebook-selectedCellBackground',
      'rgba(0, 0, 0, 0.04)',
    );
    const cellHoverBg = this.getVSCodeColor(
      '--vscode-notebook-cellHoverBackground',
      'rgba(0, 0, 0, 0.02)',
    );
    const inactiveCellBorder = this.getVSCodeColor(
      '--vscode-notebook-inactiveSelectedCellBorder',
      cellBorder,
    );

    // Apply notebook-specific colors
    variables['--jp-notebook-background'] = notebookBg;
    variables['--jp-layout-color0'] = notebookBg; // Main background

    // Cell backgrounds - VS Code uses the editor background for cells
    variables['--jp-cell-background'] = cellBg;
    variables['--jp-layout-color1'] = cellBg; // Cell background

    // Make cells blend better with the background
    if (this._colorMode === 'dark') {
      // Dark theme adjustments
      variables['--jp-cell-editor-background'] = this.getVSCodeColor(
        '--vscode-notebook-cellEditorBackground',
        this.getVSCodeColor('--vscode-editor-background', '#1e1e1e'),
      );
      variables['--jp-layout-color2'] = this.lightenDarkenColor(notebookBg, 10); // Slightly lighter
      variables['--jp-layout-color3'] = this.lightenDarkenColor(notebookBg, 20); // Even lighter
    } else {
      // Light theme adjustments
      variables['--jp-cell-editor-background'] = this.getVSCodeColor(
        '--vscode-notebook-cellEditorBackground',
        this.getVSCodeColor('--vscode-editor-background', '#ffffff'),
      );
      variables['--jp-layout-color2'] = this.lightenDarkenColor(notebookBg, -5); // Slightly darker
      variables['--jp-layout-color3'] = this.lightenDarkenColor(
        notebookBg,
        -10,
      ); // Even darker
    }

    // Border colors - make them very subtle like VS Code
    variables['--jp-cell-border-color'] = cellBorder;
    variables['--jp-border-color0'] = cellBorder;
    variables['--jp-border-color1'] = cellBorder;
    variables['--jp-border-color2'] = 'transparent'; // Even more subtle
    variables['--jp-border-color3'] = 'transparent'; // Most subtle

    // Cell states
    variables['--jp-cell-selected-background'] = selectedCellBg;
    variables['--jp-cell-focused-border-color'] = focusedCellBorder;
    variables['--jp-notebook-multiselected-color'] = selectedCellBg;

    // Cell prompt area - make it match VS Code style
    variables['--jp-cell-prompt-width'] = '64px';
    variables['--jp-cell-prompt-font-family'] =
      variables['--jp-code-font-family'] || 'monospace';
    variables['--jp-cell-prompt-letter-spacing'] = '0px';
    variables['--jp-cell-prompt-opacity'] = '0.5';
    variables['--jp-cell-prompt-not-active-opacity'] = '0.3';

    // Input/output area styling
    variables['--jp-input-area-background'] = cellBg;
    variables['--jp-input-area-border-color'] = 'transparent';
    variables['--jp-input-active-background'] = cellBg;
    variables['--jp-input-hover-background'] = cellHoverBg;
    variables['--jp-input-active-border-color'] = focusedCellBorder;

    // Output area colors
    variables['--jp-output-area-background'] = this.getVSCodeColor(
      '--vscode-notebook-outputContainerBackgroundColor',
      colors['background.primary'] || '#ffffff',
    );

    // Cell collapse button and other interactive elements - use theme accent color
    const accentColor = this.getVSCodeColor(
      '--vscode-button-background',
      this.getVSCodeColor(
        '--vscode-focusBorder',
        colors['interactive.focus'] || '#0366d6',
      ),
    );

    // For Monokai, use the characteristic yellow/green color for buttons
    const isMonokai =
      colors['editor.background'] === '#272822' ||
      this.getVSCodeColor('--vscode-editor-background', '') === '#272822';
    const buttonColor = isMonokai ? '#A6E22E' : accentColor;

    variables['--jp-brand-color0'] = buttonColor;
    variables['--jp-brand-color1'] = buttonColor;
    variables['--jp-brand-color2'] = this.lightenDarkenColor(buttonColor, 10);
    variables['--jp-brand-color3'] = this.lightenDarkenColor(buttonColor, 20);
    variables['--jp-brand-color4'] = this.lightenDarkenColor(buttonColor, 30);

    // Inverse brand colors (for text on brand background)
    variables['--jp-inverse-layout-color0'] =
      this._colorMode === 'dark' ? '#ffffff' : '#000000';
    variables['--jp-inverse-layout-color1'] =
      this._colorMode === 'dark' ? '#ffffff' : '#000000';
    variables['--jp-inverse-layout-color2'] =
      this._colorMode === 'dark' ? '#ffffff' : '#000000';
    variables['--jp-inverse-layout-color3'] =
      this._colorMode === 'dark' ? '#ffffff' : '#000000';
    variables['--jp-inverse-layout-color4'] =
      this._colorMode === 'dark' ? '#ffffff' : '#000000';

    // Accent colors for UI elements
    variables['--jp-accent-color0'] = buttonColor;
    variables['--jp-accent-color1'] = buttonColor;
    variables['--jp-accent-color2'] = this.lightenDarkenColor(buttonColor, 10);
    variables['--jp-accent-color3'] = this.lightenDarkenColor(buttonColor, 20);

    // Ensure button styles follow theme
    variables['--jp-ui-button-color'] = buttonColor;
    variables['--jp-ui-button-hover-color'] = this.lightenDarkenColor(
      buttonColor,
      10,
    );

    return variables;
  }

  /**
   * Generate CodeMirror-specific CSS for syntax highlighting
   *
   * Creates CSS rules that map CodeMirror 6 token classes to VS Code theme colors.
   * Uses both unicode-prefixed classes (ͼ2, ͼ4, etc.) and semantic classes (.cm-keyword, .cm-string).
   * This ensures syntax highlighting in notebook cells matches VS Code's editor exactly.
   *
   * @returns CSS string with !important rules for syntax highlighting
   * @example
   * ```css
   * .cm-editor .ͼ2 { color: #C586C0 !important; } // keywords
   * .cm-editor .ͼ4 { color: #CE9178 !important; } // strings
   * ```
   */
  public getCodeMirrorCSS(): string {
    const syntaxColors = this.extractSyntaxColors();
    const isDark = this._colorMode === 'dark';

    // Build CSS rules for CodeMirror classes
    const rules: string[] = [];

    // Get colors with defaults
    const colors = {
      keyword: syntaxColors.get('keyword') || (isDark ? '#C586C0' : '#0000FF'),
      string: syntaxColors.get('string') || (isDark ? '#CE9178' : '#A31515'),
      comment: syntaxColors.get('comment') || (isDark ? '#6A9955' : '#008000'),
      function:
        syntaxColors.get('function') || (isDark ? '#DCDCAA' : '#795E26'),
      number: syntaxColors.get('number') || (isDark ? '#B5CEA8' : '#098658'),
      variable:
        syntaxColors.get('variable') || (isDark ? '#9CDCFE' : '#001080'),
      type: syntaxColors.get('type') || (isDark ? '#4EC9B0' : '#267F99'),
      constant:
        syntaxColors.get('constant') || (isDark ? '#569CD6' : '#0070C1'),
      operator:
        syntaxColors.get('operator') || (isDark ? '#D4D4D4' : '#000000'),
    };

    // First, ensure base text color is set
    const baseTextColor = this.getVSCodeColor(
      '--vscode-editor-foreground',
      isDark ? '#D4D4D4' : '#000000',
    );

    // CodeMirror 6 uses class names with unicode prefixes (ͼ)
    // These are the actual class names used by CodeMirror 6 in JupyterLab

    // Base editor styles
    rules.push(`.cm-editor { color: ${baseTextColor} !important; }`);
    rules.push(`.cm-content { color: ${baseTextColor} !important; }`);
    rules.push(`.cm-line { color: ${baseTextColor} !important; }`);

    // CodeMirror 6 token classes with unicode prefix 'ͼ'
    // These target the actual classes used by CodeMirror 6 in JupyterLab

    // Keywords (if, for, def, class, etc.)
    rules.push(`.cm-editor .ͼ2 { color: ${colors.keyword} !important; }`);
    rules.push(
      `.cm-editor .cm-keyword { color: ${colors.keyword} !important; }`,
    );

    // Strings
    rules.push(`.cm-editor .ͼ4 { color: ${colors.string} !important; }`);
    rules.push(`.cm-editor .cm-string { color: ${colors.string} !important; }`);

    // Comments
    rules.push(`.cm-editor .ͼ3 { color: ${colors.comment} !important; }`);
    rules.push(
      `.cm-editor .cm-comment { color: ${colors.comment} !important; }`,
    );

    // Functions and definitions
    rules.push(`.cm-editor .ͼ6 { color: ${colors.function} !important; }`);
    rules.push(`.cm-editor .cm-def { color: ${colors.function} !important; }`);
    rules.push(
      `.cm-editor .cm-function { color: ${colors.function} !important; }`,
    );

    // Numbers
    rules.push(`.cm-editor .ͼ5 { color: ${colors.number} !important; }`);
    rules.push(`.cm-editor .cm-number { color: ${colors.number} !important; }`);

    // Variables
    rules.push(`.cm-editor .ͼ7 { color: ${colors.variable} !important; }`);
    rules.push(
      `.cm-editor .cm-variable { color: ${colors.variable} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-variable-2 { color: ${colors.variable} !important; }`,
    );

    // Types
    rules.push(`.cm-editor .ͼ8 { color: ${colors.type} !important; }`);
    rules.push(`.cm-editor .cm-type { color: ${colors.type} !important; }`);
    rules.push(`.cm-editor .cm-typeName { color: ${colors.type} !important; }`);

    // Constants and built-ins
    rules.push(`.cm-editor .ͼ9 { color: ${colors.constant} !important; }`);
    rules.push(`.cm-editor .cm-atom { color: ${colors.constant} !important; }`);
    rules.push(
      `.cm-editor .cm-builtin { color: ${colors.constant} !important; }`,
    );
    rules.push(`.cm-editor .cm-bool { color: ${colors.constant} !important; }`);
    rules.push(`.cm-editor .cm-null { color: ${colors.constant} !important; }`);

    // Operators
    rules.push(`.cm-editor .ͼ1 { color: ${colors.operator} !important; }`);
    rules.push(
      `.cm-editor .cm-operator { color: ${colors.operator} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-punctuation { color: ${colors.operator} !important; }`,
    );

    // Properties and attributes
    rules.push(
      `.cm-editor .cm-property { color: ${colors.function} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-propertyName { color: ${colors.variable} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-attribute { color: ${colors.variable} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-attributeName { color: ${colors.variable} !important; }`,
    );

    // Additional language-specific mappings
    rules.push(`.cm-editor .cm-meta { color: ${colors.keyword} !important; }`);
    rules.push(
      `.cm-editor .cm-qualifier { color: ${colors.type} !important; }`,
    );
    rules.push(`.cm-editor .cm-tag { color: ${colors.function} !important; }`);
    rules.push(
      `.cm-editor .cm-tagName { color: ${colors.function} !important; }`,
    );

    // Brackets and delimiters
    rules.push(
      `.cm-editor .cm-bracket { color: ${colors.operator} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-brace { color: ${colors.operator} !important; }`,
    );
    rules.push(
      `.cm-editor .cm-paren { color: ${colors.operator} !important; }`,
    );

    console.log(
      '[VSCodeThemeProvider] Generated CodeMirror CSS with base color:',
      baseTextColor,
    );
    console.log(
      '[VSCodeThemeProvider] Generated CodeMirror CSS for',
      isDark ? 'dark' : 'light',
      'theme',
    );

    return rules.join('\n');
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
