/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/codemirror/createVSCodeTheme
 * Creates a proper CodeMirror 6 theme from VS Code colors
 */

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

/**
 * VS Code theme colors for CodeMirror syntax highlighting
 */
export interface VSCodeThemeColors {
  /** Editor background color */
  background: string;
  /** Default text color */
  foreground: string;
  /** Keyword syntax color */
  keyword: string;
  /** String literal color */
  string: string;
  /** Comment color */
  comment: string;
  /** Function name color */
  function: string;
  /** Number literal color */
  number: string;
  /** Variable name color */
  variable: string;
  /** Type name color */
  type: string;
  /** Constant value color */
  constant: string;
  /** Operator color */
  operator: string;
  /** Punctuation marks color */
  punctuation?: string;
  /** Text selection color */
  selection?: string;
  /** Cursor color */
  cursor?: string;
  /** Active line background color */
  activeLine?: string;
}

/**
 * Creates a CodeMirror 6 theme extension from VS Code colors
 */
export function createVSCodeTheme(
  colors: VSCodeThemeColors,
  isDark: boolean = true,
): Extension {
  // Create the editor theme
  const theme = EditorView.theme(
    {
      '&': {
        color: colors.foreground,
        backgroundColor: colors.background,
      },
      '.cm-content': {
        caretColor: colors.cursor || colors.foreground,
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: colors.cursor || colors.foreground,
      },
      '&.cm-editor.cm-focused .cm-cursor': {
        borderLeftColor: colors.cursor || colors.foreground,
      },
      '&.cm-editor .cm-selectionBackground, .cm-selectionBackground, ::selection':
        {
          backgroundColor:
            colors.selection ||
            (isDark ? 'rgba(56, 139, 253, 0.4)' : 'rgba(0, 120, 215, 0.3)'),
        },
      '&.cm-editor.cm-focused .cm-selectionBackground': {
        backgroundColor:
          colors.selection ||
          (isDark ? 'rgba(56, 139, 253, 0.4)' : 'rgba(0, 120, 215, 0.3)'),
      },
      '.cm-activeLine': {
        backgroundColor:
          colors.activeLine ||
          (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
      },
      '.cm-activeLineGutter': {
        backgroundColor:
          colors.activeLine ||
          (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'),
      },
      '.cm-gutters': {
        backgroundColor: colors.background,
        color: isDark ? '#858585' : '#6e7681',
        borderRight: 'none',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        color: isDark ? '#858585' : '#6e7681',
        padding: '0 3px 0 5px',
      },
    },
    { dark: isDark },
  );

  // Create the syntax highlighting style
  const highlightStyle = HighlightStyle.define([
    // Keywords (import, def, class, if, for, return, etc.)
    { tag: tags.keyword, color: colors.keyword },
    { tag: tags.controlKeyword, color: colors.keyword },
    { tag: tags.moduleKeyword, color: colors.keyword },
    { tag: tags.operatorKeyword, color: colors.keyword },

    // Strings
    { tag: tags.string, color: colors.string },
    { tag: tags.docString, color: colors.string },
    { tag: tags.character, color: colors.string },
    { tag: tags.regexp, color: colors.string },

    // Comments
    { tag: tags.comment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.lineComment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.blockComment, color: colors.comment, fontStyle: 'italic' },
    { tag: tags.docComment, color: colors.comment, fontStyle: 'italic' },

    // Functions and methods
    { tag: tags.function(tags.variableName), color: colors.function },
    { tag: tags.function(tags.propertyName), color: colors.function },
    {
      tag: tags.function(tags.definition(tags.variableName)),
      color: colors.function,
    },
    { tag: tags.definition(tags.function), color: colors.function },

    // Numbers
    { tag: tags.number, color: colors.number },
    { tag: tags.integer, color: colors.number },
    { tag: tags.float, color: colors.number },

    // Variables
    { tag: tags.variableName, color: colors.variable },
    { tag: tags.propertyName, color: colors.variable },
    { tag: tags.definition(tags.variableName), color: colors.variable },
    { tag: tags.local(tags.variableName), color: colors.variable },

    // Types and classes
    { tag: tags.typeName, color: colors.type },
    { tag: tags.className, color: colors.type },
    { tag: tags.definition(tags.typeName), color: colors.type },
    { tag: tags.definition(tags.className), color: colors.type },

    // Constants and special values
    { tag: tags.constant(tags.variableName), color: colors.constant },
    { tag: tags.bool, color: colors.constant },
    { tag: tags.null, color: colors.constant },
    { tag: tags.atom, color: colors.constant },
    { tag: tags.special(tags.variableName), color: colors.constant },

    // Operators
    { tag: tags.operator, color: colors.operator },
    { tag: tags.arithmeticOperator, color: colors.operator },
    { tag: tags.logicOperator, color: colors.operator },
    { tag: tags.compareOperator, color: colors.operator },
    { tag: tags.updateOperator, color: colors.operator },

    // Punctuation
    { tag: tags.punctuation, color: colors.punctuation || colors.foreground },
    { tag: tags.separator, color: colors.punctuation || colors.foreground },
    { tag: tags.bracket, color: colors.punctuation || colors.foreground },
    { tag: tags.angleBracket, color: colors.punctuation || colors.foreground },
    { tag: tags.squareBracket, color: colors.punctuation || colors.foreground },
    { tag: tags.paren, color: colors.punctuation || colors.foreground },
    { tag: tags.brace, color: colors.punctuation || colors.foreground },

    // Standard library / built-in functions
    { tag: tags.standard(tags.variableName), color: colors.function },
    { tag: tags.standard(tags.function), color: colors.function },
  ]);

  // Return the combined extensions
  return [theme, syntaxHighlighting(highlightStyle)];
}

/**
 * Apply VS Code theme to existing CodeMirror instances
 */
export function applyVSCodeThemeToEditors(
  colors: VSCodeThemeColors,
  isDark: boolean = true,
): void {
  // Find all CodeMirror instances
  const editors = document.querySelectorAll('.cm-editor');

  if (editors.length === 0) {
    // No editors found yet, they might not be rendered
    return;
  }

  editors.forEach(editorElement => {
    // Try to access the CodeMirror view instance
    // CodeMirror 6 stores the view instance on the DOM element
    const cmView =
      (editorElement as any)?.cmView || (editorElement as any)?._cmView;

    if (cmView && cmView.dispatch) {
      try {
        const theme = createVSCodeTheme(colors, isDark);

        // Apply the theme by reconfiguring the editor
        cmView.dispatch({
          effects: (cmView.state as any).reconfigure?.({
            extensions: [...(cmView.state.extensions || []), theme],
          }),
        });

        console.log('[CodeMirror Theme] Applied VS Code theme to editor');
      } catch (error) {
        console.error('[CodeMirror Theme] Failed to apply theme:', error);
      }
    } else {
      // Don't log warnings for elements that might not be initialized yet
      // This is normal during initial render
    }
  });
}
