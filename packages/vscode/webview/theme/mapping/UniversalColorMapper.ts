/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/mapping/UniversalColorMapper
 * Universal color mapping system.
 * Maps semantic color names between different theme systems.
 */

import { ThemeProviderType } from '../types';

/**
 * Color mapping configuration
 * @hidden
 */
interface IColorMapping {
  jupyterlab: string;
  vscode: string;
  primer: string;
  css?: string;
}

/**
 * Universal color mapper for translating between theme systems
 */
export class UniversalColorMapper {
  private static instance: UniversalColorMapper;

  /**
   * Comprehensive color mappings between theme systems
   */
  private readonly mappings: Record<string, IColorMapping> = {
    // Background colors
    'background.primary': {
      jupyterlab: '--jp-layout-color0',
      vscode: '--vscode-editor-background',
      primer: 'canvas.default',
      css: 'var(--theme-background-primary)',
    },
    'background.secondary': {
      jupyterlab: '--jp-layout-color1',
      vscode: '--vscode-sideBar-background',
      primer: 'canvas.subtle',
      css: 'var(--theme-background-secondary)',
    },
    'background.tertiary': {
      jupyterlab: '--jp-layout-color2',
      vscode: '--vscode-panel-background',
      primer: 'canvas.inset',
      css: 'var(--theme-background-tertiary)',
    },
    'background.overlay': {
      jupyterlab: '--jp-layout-color3',
      vscode: '--vscode-dropdown-background',
      primer: 'overlay.backdrop',
      css: 'var(--theme-background-overlay)',
    },

    // Text colors
    'text.primary': {
      jupyterlab: '--jp-ui-font-color1',
      vscode: '--vscode-editor-foreground',
      primer: 'fg.default',
      css: 'var(--theme-text-primary)',
    },
    'text.secondary': {
      jupyterlab: '--jp-ui-font-color2',
      vscode: '--vscode-descriptionForeground',
      primer: 'fg.muted',
      css: 'var(--theme-text-secondary)',
    },
    'text.disabled': {
      jupyterlab: '--jp-ui-font-color3',
      vscode: '--vscode-disabledForeground',
      primer: 'fg.subtle',
      css: 'var(--theme-text-disabled)',
    },
    'text.link': {
      jupyterlab: '--jp-content-link-color',
      vscode: '--vscode-textLink-foreground',
      primer: 'accent.fg',
      css: 'var(--theme-text-link)',
    },

    // Border colors
    'border.default': {
      jupyterlab: '--jp-border-color1',
      vscode: '--vscode-panel-border',
      primer: 'border.default',
      css: 'var(--theme-border-default)',
    },
    'border.muted': {
      jupyterlab: '--jp-border-color2',
      vscode: '--vscode-editorWidget-border',
      primer: 'border.muted',
      css: 'var(--theme-border-muted)',
    },
    'border.subtle': {
      jupyterlab: '--jp-border-color3',
      vscode: '--vscode-widget-border',
      primer: 'border.subtle',
      css: 'var(--theme-border-subtle)',
    },

    // Status colors
    'status.error': {
      jupyterlab: '--jp-error-color1',
      vscode: '--vscode-errorForeground',
      primer: 'danger.fg',
      css: 'var(--theme-status-error)',
    },
    'status.warning': {
      jupyterlab: '--jp-warn-color1',
      vscode: '--vscode-editorWarning-foreground',
      primer: 'attention.fg',
      css: 'var(--theme-status-warning)',
    },
    'status.success': {
      jupyterlab: '--jp-success-color1',
      vscode: '--vscode-terminal-ansiGreen',
      primer: 'success.fg',
      css: 'var(--theme-status-success)',
    },
    'status.info': {
      jupyterlab: '--jp-info-color1',
      vscode: '--vscode-terminal-ansiBlue',
      primer: 'accent.fg',
      css: 'var(--theme-status-info)',
    },

    // Interactive states
    'interactive.hover': {
      jupyterlab: '--jp-layout-color1',
      vscode: '--vscode-list-hoverBackground',
      primer: 'neutral.muted',
      css: 'var(--theme-interactive-hover)',
    },
    'interactive.active': {
      jupyterlab: '--jp-brand-color1',
      vscode: '--vscode-list-activeSelectionBackground',
      primer: 'accent.emphasis',
      css: 'var(--theme-interactive-active)',
    },
    'interactive.focus': {
      jupyterlab: '--jp-brand-color1',
      vscode: '--vscode-focusBorder',
      primer: 'accent.emphasis',
      css: 'var(--theme-interactive-focus)',
    },

    // Editor specific
    'editor.background': {
      jupyterlab: '--jp-cell-editor-background',
      vscode: '--vscode-editor-background',
      primer: 'canvas.default',
      css: 'var(--theme-editor-background)',
    },
    'editor.foreground': {
      jupyterlab: '--jp-code-font-color',
      vscode: '--vscode-editor-foreground',
      primer: 'fg.default',
      css: 'var(--theme-editor-foreground)',
    },
    'editor.selection': {
      jupyterlab: '--jp-cell-editor-active-background',
      vscode: '--vscode-editor-selectionBackground',
      primer: 'accent.muted',
      css: 'var(--theme-editor-selection)',
    },
    'editor.lineHighlight': {
      jupyterlab: '--jp-cell-editor-active-background',
      vscode: '--vscode-editor-lineHighlightBackground',
      primer: 'neutral.subtle',
      css: 'var(--theme-editor-line-highlight)',
    },
    'editor.cursor': {
      jupyterlab: '--jp-editor-cursor-color',
      vscode: '--vscode-editorCursor-foreground',
      primer: 'fg.default',
      css: 'var(--theme-editor-cursor)',
    },

    // Typography
    'font.family.default': {
      jupyterlab: '--jp-ui-font-family',
      vscode: '--vscode-font-family',
      primer: 'fonts.normal',
      css: 'var(--theme-font-family-default)',
    },
    'font.family.mono': {
      jupyterlab: '--jp-code-font-family',
      vscode: '--vscode-editor-font-family',
      primer: 'fonts.mono',
      css: 'var(--theme-font-family-mono)',
    },
    'font.size.base': {
      jupyterlab: '--jp-ui-font-size1',
      vscode: '--vscode-editor-font-size',
      primer: 'fontSizes.1',
      css: 'var(--theme-font-size-base)',
    },

    // Buttons
    'button.primary.background': {
      jupyterlab: '--jp-brand-color1',
      vscode: '--vscode-button-background',
      primer: 'btn.primary.bg',
      css: 'var(--theme-button-primary-bg)',
    },
    'button.primary.foreground': {
      jupyterlab: '--jp-ui-inverse-font-color1',
      vscode: '--vscode-button-foreground',
      primer: 'btn.primary.text',
      css: 'var(--theme-button-primary-fg)',
    },
    'button.secondary.background': {
      jupyterlab: '--jp-layout-color1',
      vscode: '--vscode-button-secondaryBackground',
      primer: 'btn.bg',
      css: 'var(--theme-button-secondary-bg)',
    },
    'button.secondary.foreground': {
      jupyterlab: '--jp-ui-font-color1',
      vscode: '--vscode-button-secondaryForeground',
      primer: 'btn.text',
      css: 'var(--theme-button-secondary-fg)',
    },
  };

  /**
   * Get singleton instance
   */
  static getInstance(): UniversalColorMapper {
    if (!UniversalColorMapper.instance) {
      UniversalColorMapper.instance = new UniversalColorMapper();
    }
    return UniversalColorMapper.instance;
  }

  /**
   * Map a semantic color name to a specific provider's variable
   */
  mapColor(semanticName: string, provider: ThemeProviderType): string {
    const mapping = this.mappings[semanticName];
    if (!mapping) {
      console.warn(`No mapping found for semantic color: ${semanticName}`);
      return semanticName;
    }

    switch (provider) {
      case 'jupyterlab':
        return mapping.jupyterlab;
      case 'vscode':
        return mapping.vscode;
      case 'custom':
        return mapping.css || semanticName;
      default:
        return mapping.primer;
    }
  }

  /**
   * Get CSS variable for semantic color
   */
  getCSSVariable(semanticName: string): string {
    const mapping = this.mappings[semanticName];
    return mapping?.css || `var(--theme-${semanticName.replace(/\./g, '-')})`;
  }

  /**
   * Map all colors for a specific provider
   */
  mapAllColors(provider: ThemeProviderType): Record<string, string> {
    const mapped: Record<string, string> = {};
    Object.keys(this.mappings).forEach(semanticName => {
      mapped[semanticName] = this.mapColor(semanticName, provider);
    });
    return mapped;
  }

  /**
   * Get all semantic color names
   */
  getSemanticColorNames(): string[] {
    return Object.keys(this.mappings);
  }

  /**
   * Add custom color mapping
   */
  addMapping(semanticName: string, mapping: Partial<IColorMapping>): void {
    if (this.mappings[semanticName]) {
      Object.assign(this.mappings[semanticName], mapping);
    } else {
      this.mappings[semanticName] = {
        jupyterlab: mapping.jupyterlab || semanticName,
        vscode: mapping.vscode || semanticName,
        primer: mapping.primer || semanticName,
        css: mapping.css,
      };
    }
  }

  /**
   * Generate CSS variables from semantic colors
   */
  generateCSSVariables(colors: Record<string, string>): string {
    const cssLines: string[] = [];
    Object.entries(colors).forEach(([semantic, value]) => {
      const cssVar = this.getCSSVariable(semantic);
      const varName = cssVar.replace('var(', '').replace(')', '');
      cssLines.push(`  ${varName}: ${value};`);
    });
    return `:root {\n${cssLines.join('\n')}\n}`;
  }
}
