#!/usr/bin/env node

/* eslint-env node */
/* global require */
/* eslint-disable @typescript-eslint/no-require-imports, no-console */

/**
 * Post-build script to patch NotebookAdapter with VS Code syntax highlighting support
 *
 * @description This script injects VS Code theme-aware syntax highlighting into the compiled
 * NotebookAdapter.js file. It adds CodeMirror 6 HighlightStyle extensions that match VS Code's
 * active theme colors exactly, ensuring consistent syntax highlighting between VS Code editor
 * and notebook cells.
 *
 * @author Datalayer Team
 * @since September 2025
 *
 * Key features:
 * - Dynamically applies VS Code theme colors to CodeMirror syntax highlighting
 * - Uses Lezer parser tags for accurate token identification
 * - Only activates in VS Code environment (checks for __vscodeThemeProvider)
 * - Respects useVSCodeTheme flag for granular control
 * - Safe to run multiple times (checks for existing patches)
 *
 * @example
 * ```bash
 * # Automatically run after build
 * npm run build
 *
 * # Or run manually
 * node scripts/patch-vscode-highlighting.js
 * ```
 */

const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(
  __dirname,
  '../lib/components/notebook/NotebookAdapter.js'
);

// Read the file
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Check if already patched
if (content.includes('VS Code Syntax Highlighting Extension')) {
  console.log(
    '✓ NotebookAdapter.js already patched for VS Code syntax highlighting'
  );
  process.exit(0);
}

// Find the location to insert the patch - right after the default extensions are added
const searchPattern =
  /(\s+for \(const extensionFactory of EditorExtensionRegistry\.getDefaultExtensions\({ themes }\)\) {\s+registry\.addExtension\(extensionFactory\);\s+}\s+)(registry\.addExtension\({)/;

const vscodeHighlightingCode = `
            // VS Code Syntax Highlighting Extension (only in VS Code environment)
            // This is safe to include - it only activates when:
            // 1. __vscodeThemeProvider is present (VS Code environment)
            // 2. useVSCodeTheme is not explicitly set to false
            const useVSCodeTheme = window.__useVSCodeTheme !== false; // Default to true
            if (typeof window !== 'undefined' && window.__vscodeThemeProvider && useVSCodeTheme) {
                try {
                    // Dynamically import to avoid issues in non-VS Code environments
                    const lezerHighlight = require('@lezer/highlight');
                    const codeMirrorLanguage = require('@codemirror/language');

                    // Check if the required exports exist
                    if (lezerHighlight?.tags && codeMirrorLanguage?.HighlightStyle && codeMirrorLanguage?.syntaxHighlighting) {
                        const { tags } = lezerHighlight;
                        const { HighlightStyle, syntaxHighlighting } = codeMirrorLanguage;

                        const provider = window.__vscodeThemeProvider;

                        // Safely check if provider has the required methods
                        if (provider && typeof provider.extractSyntaxColors === 'function') {
                            const syntaxColors = provider.extractSyntaxColors();
                            const isDark = provider._colorMode === 'dark';

                            const colors = {
                                keyword: syntaxColors.get('keyword') || (isDark ? '#C586C0' : '#0000FF'),
                                string: syntaxColors.get('string') || (isDark ? '#CE9178' : '#A31515'),
                                comment: syntaxColors.get('comment') || (isDark ? '#6A9955' : '#008000'),
                                function: syntaxColors.get('function') || (isDark ? '#DCDCAA' : '#795E26'),
                                number: syntaxColors.get('number') || (isDark ? '#B5CEA8' : '#098658'),
                                variable: syntaxColors.get('variable') || (isDark ? '#9CDCFE' : '#001080'),
                                type: syntaxColors.get('type') || (isDark ? '#4EC9B0' : '#267F99'),
                                constant: syntaxColors.get('constant') || (isDark ? '#569CD6' : '#0070C1'),
                                operator: syntaxColors.get('operator') || (isDark ? '#D4D4D4' : '#000000'),
                            };

                            const highlightStyle = HighlightStyle.define([
                                { tag: tags.keyword, color: colors.keyword },
                                { tag: tags.controlKeyword, color: colors.keyword },
                                { tag: tags.moduleKeyword, color: colors.keyword },
                                { tag: tags.operatorKeyword, color: colors.keyword },
                                { tag: tags.string, color: colors.string },
                                { tag: tags.docString, color: colors.string },
                                { tag: tags.comment, color: colors.comment, fontStyle: 'italic' },
                                { tag: tags.lineComment, color: colors.comment, fontStyle: 'italic' },
                                { tag: tags.blockComment, color: colors.comment, fontStyle: 'italic' },
                                { tag: tags.function(tags.variableName), color: colors.function },
                                { tag: tags.methodName, color: colors.function },
                                { tag: tags.number, color: colors.number },
                                { tag: tags.integer, color: colors.number },
                                { tag: tags.float, color: colors.number },
                                { tag: tags.bool, color: colors.constant },
                                { tag: tags.null, color: colors.constant },
                                { tag: tags.variableName, color: colors.variable },
                                { tag: tags.typeName, color: colors.type },
                                { tag: tags.className, color: colors.type },
                                { tag: tags.propertyName, color: colors.variable },
                                { tag: tags.operator, color: colors.operator },
                                { tag: tags.punctuation, color: colors.operator },
                                { tag: tags.bracket, color: colors.operator },
                            ]);

                            registry.addExtension({
                                name: 'vscode-syntax-highlighting',
                                factory: () => EditorExtensionRegistry.createImmutableExtension(
                                    syntaxHighlighting(highlightStyle)
                                ),
                            });

                            console.log('[NotebookAdapter] Added VS Code syntax highlighting extension');
                        } else {
                            console.log('[NotebookAdapter] VS Code theme provider found but missing required methods');
                        }
                    } else {
                        console.log('[NotebookAdapter] Required CodeMirror modules not available for VS Code highlighting');
                    }
                } catch (error) {
                    // Silently fail - this is optional enhancement for VS Code
                    console.log('[NotebookAdapter] VS Code syntax highlighting not available:', error.message);
                }
            }
            `;

// Apply the patch
if (searchPattern.test(content)) {
  content = content.replace(
    searchPattern,
    `$1${vscodeHighlightingCode}\n            $2`
  );
  fs.writeFileSync(FILE_PATH, content, 'utf8');
  console.log(
    '✓ Patched NotebookAdapter.js with VS Code syntax highlighting support'
  );
} else {
  console.error('✗ Could not find the target pattern in NotebookAdapter.js');
  console.error(
    'The file structure may have changed. Please update the patch script.'
  );
  process.exit(1);
}
