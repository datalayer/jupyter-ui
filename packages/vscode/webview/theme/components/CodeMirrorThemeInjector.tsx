/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/components/CodeMirrorThemeInjector
 * Component that injects VS Code theme into CodeMirror 6 editors
 */

import { useEffect } from 'react';
import {
  applyVSCodeThemeToEditors,
  VSCodeThemeColors,
} from '../codemirror/createVSCodeTheme';
import { IThemeProvider } from '../types';

/**
 * @hidden
 */
interface CodeMirrorThemeInjectorProps {
  provider: IThemeProvider | null;
}

/**
 * Component that finds and themes CodeMirror 6 editors in the page
 */
export function CodeMirrorThemeInjector({
  provider,
}: CodeMirrorThemeInjectorProps) {
  useEffect(() => {
    const applyTheme = () => {
      // Get colors from provider if available
      const isDark = provider?.getColorMode() === 'dark';
      const cssVars = provider?.getCSSVariables() || {};

      // Get VS Code background color
      const vscodeBackground =
        document.documentElement.style.getPropertyValue(
          '--vscode-editor-background',
        ) ||
        getComputedStyle(document.documentElement).getPropertyValue(
          '--vscode-editor-background',
        ) ||
        (isDark ? '#1e1e1e' : '#ffffff');

      // Get VS Code foreground color
      const vscodeForeground =
        document.documentElement.style.getPropertyValue(
          '--vscode-editor-foreground',
        ) ||
        getComputedStyle(document.documentElement).getPropertyValue(
          '--vscode-editor-foreground',
        ) ||
        (isDark ? '#D4D4D4' : '#000000');

      // Extract syntax colors from provider or use defaults
      const syntaxColors =
        provider?.getSyntaxColors?.() || new Map<string, string>();

      // Create theme colors using actual VS Code theme colors or sensible defaults
      const themeColors: VSCodeThemeColors = {
        background: vscodeBackground,
        foreground: vscodeForeground,
        keyword:
          syntaxColors.get('keyword') ||
          cssVars['--jp-mirror-editor-keyword-color'] ||
          (isDark ? '#C586C0' : '#0000FF'),
        string:
          syntaxColors.get('string') ||
          cssVars['--jp-mirror-editor-string-color'] ||
          (isDark ? '#CE9178' : '#A31515'),
        comment:
          syntaxColors.get('comment') ||
          cssVars['--jp-mirror-editor-comment-color'] ||
          (isDark ? '#6A9955' : '#008000'),
        function:
          syntaxColors.get('function') ||
          cssVars['--jp-mirror-editor-def-color'] ||
          (isDark ? '#DCDCAA' : '#795E26'),
        number:
          syntaxColors.get('number') ||
          cssVars['--jp-mirror-editor-number-color'] ||
          (isDark ? '#B5CEA8' : '#098658'),
        variable:
          syntaxColors.get('variable') ||
          cssVars['--jp-mirror-editor-variable-color'] ||
          (isDark ? '#9CDCFE' : '#001080'),
        type:
          syntaxColors.get('type') ||
          cssVars['--jp-mirror-editor-variable-3-color'] ||
          (isDark ? '#4EC9B0' : '#267F99'),
        constant:
          syntaxColors.get('constant') ||
          cssVars['--jp-mirror-editor-atom-color'] ||
          (isDark ? '#569CD6' : '#0070C1'),
        operator:
          syntaxColors.get('operator') ||
          cssVars['--jp-mirror-editor-operator-color'] ||
          vscodeForeground,
        punctuation: vscodeForeground,
        selection: isDark
          ? 'rgba(38, 79, 120, 0.5)'
          : 'rgba(173, 214, 255, 0.5)',
        cursor: vscodeForeground,
        activeLine: isDark
          ? 'rgba(255, 255, 255, 0.04)'
          : 'rgba(0, 0, 0, 0.02)',
      };

      console.log(
        '[CodeMirrorThemeInjector] Prepared theme colors:',
        themeColors,
      );

      // We don't need to apply the theme dynamically anymore
      // The CSS injection from VSCodeThemeProvider.getCodeMirrorCSS() handles it
    };

    // Apply theme once
    applyTheme();
  }, [provider]);

  return null;
}

export default CodeMirrorThemeInjector;
