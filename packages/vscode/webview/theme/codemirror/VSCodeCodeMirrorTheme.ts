/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/codemirror/VSCodeCodeMirrorTheme
 * CodeMirror 6 theme that matches VS Code's syntax highlighting
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

/**
 * Get VS Code colors for syntax highlighting
 */
export interface VSCodeColors {
  /** Editor background color */
  background?: string;
  /** Default text foreground color */
  foreground?: string;
  /** Keyword color (if, for, while, etc.) */
  keyword?: string;
  /** String literal color */
  string?: string;
  /** Comment color */
  comment?: string;
  /** Function and method name color */
  function?: string;
  /** Number literal color */
  number?: string;
  /** Variable name color */
  variable?: string;
  /** Type and interface name color */
  type?: string;
  /** Constant and boolean value color */
  constant?: string;
  /** Operator color (+, -, *, etc.) */
  operator?: string;
  /** Class name color */
  className?: string;
  /** Namespace/module name color */
  namespace?: string;
  /** Punctuation color (brackets, semicolons, etc.) */
  punctuation?: string;
  /** Invalid/error syntax color */
  invalid?: string;
  /** Cursor color */
  cursor?: string;
  /** Selection background color */
  selection?: string;
  /** Active line highlight color */
  lineHighlight?: string;
}

/**
 * Default colors for different VS Code themes
 */
const themeColors: Record<string, VSCodeColors> = {
  'dark+': {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    keyword: '#C586C0',
    string: '#CE9178',
    comment: '#6A9955',
    function: '#DCDCAA',
    number: '#B5CEA8',
    variable: '#9CDCFE',
    type: '#4EC9B0',
    constant: '#569CD6',
    operator: '#D4D4D4',
    className: '#4EC9B0',
    namespace: '#4EC9B0',
    punctuation: '#D4D4D4',
    invalid: '#F44747',
    cursor: '#AEAFAD',
    selection: '#264F78',
    lineHighlight: '#2A2D2E',
  },
  monokai: {
    background: '#272822',
    foreground: '#F8F8F2',
    keyword: '#F92672',
    string: '#E6DB74',
    comment: '#75715E',
    function: '#A6E22E',
    number: '#AE81FF',
    variable: '#F8F8F2',
    type: '#66D9EF',
    constant: '#AE81FF',
    operator: '#F92672',
    className: '#A6E22E',
    namespace: '#66D9EF',
    punctuation: '#F8F8F2',
    invalid: '#F44747',
    cursor: '#F8F8F0',
    selection: '#49483E',
    lineHighlight: '#3E3D32',
  },
  light: {
    background: '#ffffff',
    foreground: '#000000',
    keyword: '#0000FF',
    string: '#A31515',
    comment: '#008000',
    function: '#795E26',
    number: '#098658',
    variable: '#001080',
    type: '#267F99',
    constant: '#0070C1',
    operator: '#000000',
    className: '#267F99',
    namespace: '#267F99',
    punctuation: '#000000',
    invalid: '#CD3131',
    cursor: '#000000',
    selection: '#ADD6FF',
    lineHighlight: '#F0F0F0',
  },
};

/**
 * Create a CodeMirror 6 theme that matches VS Code
 * @param colors Custom color palette for the theme
 * @param isDark Whether to create a dark or light theme
 * @returns CodeMirror Extension with theme and syntax highlighting
 */
export function createVSCodeTheme(
  colors?: VSCodeColors,
  isDark = true,
): Extension {
  // Use provided colors or defaults
  const c = colors || (isDark ? themeColors['dark+'] : themeColors.light);

  // Create editor theme
  const editorTheme = EditorView.theme(
    {
      '&': {
        color: c.foreground || '#d4d4d4',
        backgroundColor: c.background || '#1e1e1e',
      },
      '.cm-content': {
        caretColor: c.cursor || '#aeafad',
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: c.cursor || '#aeafad',
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection':
        {
          backgroundColor: c.selection || '#264f78',
        },
      '.cm-activeLine': {
        backgroundColor: c.lineHighlight || '#2a2d2e',
      },
      '.cm-gutters': {
        backgroundColor: c.background || '#1e1e1e',
        color: '#858585',
        border: 'none',
      },
      '.cm-activeLineGutter': {
        backgroundColor: c.lineHighlight || '#2a2d2e',
      },
      '.cm-lineNumbers .cm-activeLineGutter': {
        color: c.foreground || '#d4d4d4',
      },
    },
    { dark: isDark },
  );

  // Create syntax highlighting styles
  const highlightStyle = HighlightStyle.define([
    // Keywords
    { tag: t.keyword, color: c.keyword || '#C586C0' },
    { tag: t.controlKeyword, color: c.keyword || '#C586C0' },
    { tag: t.operatorKeyword, color: c.keyword || '#C586C0' },
    { tag: t.definitionKeyword, color: c.keyword || '#C586C0' },
    { tag: t.moduleKeyword, color: c.keyword || '#C586C0' },

    // Strings
    { tag: t.string, color: c.string || '#CE9178' },
    { tag: t.docString, color: c.string || '#CE9178' },
    { tag: t.character, color: c.string || '#CE9178' },
    { tag: t.attributeValue, color: c.string || '#CE9178' },

    // Comments
    { tag: t.comment, color: c.comment || '#6A9955', fontStyle: 'italic' },
    { tag: t.lineComment, color: c.comment || '#6A9955', fontStyle: 'italic' },
    { tag: t.blockComment, color: c.comment || '#6A9955', fontStyle: 'italic' },
    { tag: t.docComment, color: c.comment || '#6A9955', fontStyle: 'italic' },

    // Functions and methods
    { tag: t.function(t.variableName), color: c.function || '#DCDCAA' },
    {
      tag: t.function(t.definition(t.variableName)),
      color: c.function || '#DCDCAA',
    },
    {
      tag: t.definition(t.function(t.variableName)),
      color: c.function || '#DCDCAA',
    },
    // { tag: t.methodName, color: c.function || '#DCDCAA' }, // methodName doesn't exist in lezer
    { tag: t.propertyName, color: c.function || '#DCDCAA' },

    // Numbers
    { tag: t.number, color: c.number || '#B5CEA8' },
    { tag: t.integer, color: c.number || '#B5CEA8' },
    { tag: t.float, color: c.number || '#B5CEA8' },

    // Variables
    { tag: t.variableName, color: c.variable || '#9CDCFE' },
    { tag: t.definition(t.variableName), color: c.variable || '#9CDCFE' },
    { tag: t.local(t.variableName), color: c.variable || '#9CDCFE' },

    // Types and classes
    { tag: t.typeName, color: c.type || '#4EC9B0' },
    { tag: t.className, color: c.className || '#4EC9B0' },
    { tag: t.definition(t.typeName), color: c.type || '#4EC9B0' },
    { tag: t.definition(t.className), color: c.className || '#4EC9B0' },

    // Constants and booleans
    { tag: t.constant(t.variableName), color: c.constant || '#569CD6' },
    { tag: t.bool, color: c.constant || '#569CD6' },
    { tag: t.null, color: c.constant || '#569CD6' },

    // Operators
    { tag: t.operator, color: c.operator || '#D4D4D4' },
    { tag: t.arithmeticOperator, color: c.operator || '#D4D4D4' },
    { tag: t.logicOperator, color: c.operator || '#D4D4D4' },
    { tag: t.compareOperator, color: c.operator || '#D4D4D4' },

    // Other
    { tag: t.namespace, color: c.namespace || '#4EC9B0' },
    { tag: t.punctuation, color: c.punctuation || '#D4D4D4' },
    { tag: t.bracket, color: c.punctuation || '#D4D4D4' },
    { tag: t.angleBracket, color: c.punctuation || '#D4D4D4' },
    { tag: t.squareBracket, color: c.punctuation || '#D4D4D4' },
    { tag: t.paren, color: c.punctuation || '#D4D4D4' },
    { tag: t.brace, color: c.punctuation || '#D4D4D4' },
    { tag: t.invalid, color: c.invalid || '#F44747' },

    // Python specific
    { tag: t.self, color: c.keyword || '#C586C0' },
    // { tag: t.decorator, color: c.function || '#DCDCAA' }, // decorator doesn't exist in lezer
    { tag: t.meta, color: c.keyword || '#C586C0' },
  ]);

  return [editorTheme, syntaxHighlighting(highlightStyle)];
}

/**
 * Create Monokai theme
 */
export function createMonokaiTheme(): Extension {
  return createVSCodeTheme(themeColors.monokai, true);
}

/**
 * Create Dark+ theme
 */
export function createDarkPlusTheme(): Extension {
  return createVSCodeTheme(themeColors['dark+'], true);
}

/**
 * Create Light theme
 */
export function createLightTheme(): Extension {
  return createVSCodeTheme(themeColors.light, false);
}

/**
 * Detect VS Code theme and create appropriate CodeMirror theme
 */
export function createThemeFromVSCode(): Extension {
  // Try to detect the current VS Code theme
  const rootStyles = getComputedStyle(document.documentElement);
  const bgColor = rootStyles
    .getPropertyValue('--vscode-editor-background')
    .trim();
  const fgColor = rootStyles
    .getPropertyValue('--vscode-editor-foreground')
    .trim();

  // Check if it's Monokai
  if (bgColor === '#272822' || bgColor === 'rgb(39, 40, 34)') {
    return createMonokaiTheme();
  }

  // Determine if dark or light
  const isDark = isColorDark(bgColor);

  // Extract actual colors from VS Code
  const colors: VSCodeColors = {
    background: bgColor,
    foreground: fgColor,
    keyword:
      rootStyles
        .getPropertyValue('--vscode-symbolIcon-keywordForeground')
        .trim() || undefined,
    string:
      rootStyles
        .getPropertyValue('--vscode-symbolIcon-stringForeground')
        .trim() || undefined,
    comment:
      rootStyles.getPropertyValue('--vscode-editor-foreground').trim() ||
      undefined,
    // Add more color extractions as needed
  };

  // If we have some colors, use them; otherwise use defaults
  if (bgColor && fgColor) {
    return createVSCodeTheme(colors, isDark);
  }

  // Fall back to defaults
  return isDark ? createDarkPlusTheme() : createLightTheme();
}

/**
 * Helper to determine if a color is dark
 * @param color Color string in hex or rgb format
 * @returns true if the color is dark (luminance < 0.5)
 */
function isColorDark(color: string): boolean {
  // Default to dark if we can't determine
  if (!color) return true;

  // Parse RGB values
  let r = 0,
    g = 0,
    b = 0;

  if (color.startsWith('#')) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
  } else if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g);
    if (match) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    }
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
