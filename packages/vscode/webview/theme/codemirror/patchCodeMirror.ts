/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/codemirror/patchCodeMirror
 * Patches CodeMirror initialization to inject VS Code syntax highlighting
 */

import { tags } from '@lezer/highlight';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';

/**
 * VS Code theme colors interface
 * @hidden
 */
interface VSCodeColors {
  keyword: string;
  string: string;
  comment: string;
  function: string;
  number: string;
  variable: string;
  type: string;
  constant: string;
  operator: string;
  bracket: string;
  meta: string;
  property: string;
}

/**
 * Create a CodeMirror HighlightStyle from VS Code colors
 */
export function createVSCodeHighlightStyle(
  colors: VSCodeColors,
): HighlightStyle {
  return HighlightStyle.define([
    // Keywords (if, for, def, class, return, etc.)
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
    {
      tag: tags.function(tags.definition(tags.variableName)),
      color: colors.function,
    },
    { tag: tags.methodName, color: colors.function },
    {
      tag: tags.definition(tags.function(tags.variableName)),
      color: colors.function,
    },

    // Numbers and constants
    { tag: tags.number, color: colors.number },
    { tag: tags.integer, color: colors.number },
    { tag: tags.float, color: colors.number },
    { tag: tags.bool, color: colors.constant },
    { tag: tags.null, color: colors.constant },
    { tag: tags.constant(tags.variableName), color: colors.constant },
    { tag: tags.special(tags.variableName), color: colors.constant },

    // Variables
    { tag: tags.variableName, color: colors.variable },
    { tag: tags.local(tags.variableName), color: colors.variable },
    { tag: tags.definition(tags.variableName), color: colors.variable },

    // Types and classes
    { tag: tags.typeName, color: colors.type },
    { tag: tags.className, color: colors.type },
    { tag: tags.definition(tags.typeName), color: colors.type },
    { tag: tags.definition(tags.className), color: colors.type },
    { tag: tags.namespace, color: colors.type },

    // Properties and attributes
    { tag: tags.propertyName, color: colors.property },
    { tag: tags.definition(tags.propertyName), color: colors.property },
    { tag: tags.attributeName, color: colors.property },

    // Operators and punctuation
    { tag: tags.operator, color: colors.operator },
    { tag: tags.arithmeticOperator, color: colors.operator },
    { tag: tags.logicOperator, color: colors.operator },
    { tag: tags.bitwiseOperator, color: colors.operator },
    { tag: tags.compareOperator, color: colors.operator },
    { tag: tags.updateOperator, color: colors.operator },
    { tag: tags.punctuation, color: colors.bracket },
    { tag: tags.bracket, color: colors.bracket },
    { tag: tags.paren, color: colors.bracket },
    { tag: tags.brace, color: colors.bracket },
    { tag: tags.squareBracket, color: colors.bracket },

    // Meta
    { tag: tags.meta, color: colors.meta },
    { tag: tags.processingInstruction, color: colors.meta },

    // Markup (for markdown, HTML, etc.)
    { tag: tags.heading, color: colors.keyword, fontWeight: 'bold' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strong, fontWeight: 'bold' },
    { tag: tags.link, color: colors.string, textDecoration: 'underline' },
    { tag: tags.url, color: colors.string, textDecoration: 'underline' },

    // Other
    { tag: tags.atom, color: colors.constant },
    { tag: tags.self, color: colors.keyword, fontStyle: 'italic' },
    { tag: tags.unit, color: colors.number },
  ]);
}

/**
 * Patch the CodeMirror editor factory to include VS Code syntax highlighting
 */
export function patchCodeMirrorForVSCode(): void {
  // We need to intercept the EditorExtensionRegistry creation
  // This is a bit tricky since it's created inside the notebook adapter

  // Try to find the EditorExtensionRegistry on the global scope
  const win = window as any;

  // Store the original if it exists
  const originalRegistry = win.EditorExtensionRegistry;

  if (!originalRegistry) {
    console.warn(
      '[patchCodeMirror] EditorExtensionRegistry not found on window',
    );
    // We'll try a different approach - patch after the notebook is created
    patchAfterNotebookCreation();
    return;
  }

  // Patch the addExtension method to inject our syntax highlighting
  const originalAddExtension = originalRegistry.prototype.addExtension;
  originalRegistry.prototype.addExtension = function (extension: any) {
    // Call the original method
    originalAddExtension.call(this, extension);

    // Add our syntax highlighting extension
    if (!this._vsCodeHighlightingAdded) {
      this._vsCodeHighlightingAdded = true;

      // Get VS Code colors from the theme provider if available
      const colors = getVSCodeColors();
      if (colors) {
        const highlightStyle = createVSCodeHighlightStyle(colors);
        const syntaxExtension = syntaxHighlighting(highlightStyle);

        // Add as an immutable extension
        const immutableExtension = {
          name: 'vscode-syntax-highlighting',
          factory: () => syntaxExtension,
        };

        originalAddExtension.call(this, immutableExtension);
        console.log(
          '[patchCodeMirror] Added VS Code syntax highlighting extension',
        );
      }
    }
  };
}

/**
 * Alternative approach: patch after notebook creation
 */
function patchAfterNotebookCreation(): void {
  // Listen for notebook creation and patch the editors
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          // Look for CodeMirror editors
          const editors = node.querySelectorAll('.cm-editor');
          editors.forEach(editor => {
            patchExistingEditor(editor as HTMLElement);
          });
        }
      });
    });
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also patch any existing editors
  document.querySelectorAll('.cm-editor').forEach(editor => {
    patchExistingEditor(editor as HTMLElement);
  });
}

/**
 * Patch an existing CodeMirror editor instance
 */
function patchExistingEditor(editorElement: HTMLElement): void {
  const view = (editorElement as any).cmView || (editorElement as any)._cmView;

  if (!view || !view.state) {
    return;
  }

  // Check if we've already patched this editor
  if ((view as any)._vsCodePatched) {
    return;
  }
  (view as any)._vsCodePatched = true;

  try {
    const colors = getVSCodeColors();
    if (!colors) {
      return;
    }

    const highlightStyle = createVSCodeHighlightStyle(colors);
    const syntaxExtension = syntaxHighlighting(highlightStyle);

    // Add the extension to the editor
    view.dispatch({
      effects: view.state.reconfigure({
        extensions: [...(view.state.extensions || []), syntaxExtension],
      }),
    });

    console.log(
      '[patchCodeMirror] Patched existing editor with VS Code syntax highlighting',
    );
  } catch (error) {
    console.error('[patchCodeMirror] Failed to patch editor:', error);
  }
}

/**
 * Get VS Code colors from the theme provider
 */
function getVSCodeColors(): VSCodeColors | null {
  // Try to get colors from our theme provider
  const provider = (window as any).__vscodeThemeProvider;

  if (provider && typeof provider.extractSyntaxColors === 'function') {
    const syntaxColors = provider.extractSyntaxColors();
    const isDark = provider._colorMode === 'dark';

    return {
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
      bracket: syntaxColors.get('operator') || (isDark ? '#D4D4D4' : '#000000'),
      meta: syntaxColors.get('keyword') || (isDark ? '#C586C0' : '#0000FF'),
      property:
        syntaxColors.get('variable') || (isDark ? '#9CDCFE' : '#001080'),
    };
  }

  // Fallback to extracting from CSS variables
  const getColor = (cssVar: string, fallback: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(
      cssVar,
    );
    return value?.trim() || fallback;
  };

  const isDark = getColor('--vscode-editor-background', '#ffffff')
    .toLowerCase()
    .includes('2');

  return {
    keyword: getColor(
      '--vscode-debugTokenExpression-name',
      isDark ? '#C586C0' : '#0000FF',
    ),
    string: getColor(
      '--vscode-debugTokenExpression-string',
      isDark ? '#CE9178' : '#A31515',
    ),
    comment: getColor(
      '--vscode-editor-foreground',
      isDark ? '#6A9955' : '#008000',
    ),
    function: getColor(
      '--vscode-debugTokenExpression-value',
      isDark ? '#DCDCAA' : '#795E26',
    ),
    number: getColor(
      '--vscode-debugTokenExpression-number',
      isDark ? '#B5CEA8' : '#098658',
    ),
    variable: getColor(
      '--vscode-debugTokenExpression-name',
      isDark ? '#9CDCFE' : '#001080',
    ),
    type: getColor(
      '--vscode-debugTokenExpression-type',
      isDark ? '#4EC9B0' : '#267F99',
    ),
    constant: getColor(
      '--vscode-symbolIcon-constantForeground',
      isDark ? '#569CD6' : '#0070C1',
    ),
    operator: getColor(
      '--vscode-editor-foreground',
      isDark ? '#D4D4D4' : '#000000',
    ),
    bracket: getColor(
      '--vscode-editor-foreground',
      isDark ? '#D4D4D4' : '#000000',
    ),
    meta: getColor(
      '--vscode-debugTokenExpression-name',
      isDark ? '#C586C0' : '#0000FF',
    ),
    property: getColor(
      '--vscode-debugTokenExpression-name',
      isDark ? '#9CDCFE' : '#001080',
    ),
  };
}

export default patchCodeMirrorForVSCode;
