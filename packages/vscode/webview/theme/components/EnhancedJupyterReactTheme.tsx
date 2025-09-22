/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme/components/EnhancedJupyterReactTheme
 * Enhanced theme component that supports multiple theme providers.
 * Wraps the existing JupyterReactTheme with additional functionality.
 */

import React, {
  useEffect,
  useState,
  useMemo,
  createContext,
  useContext,
} from 'react';
import { JupyterReactTheme } from '@datalayer/jupyter-react';
import { IDisposable } from '@lumino/disposable';
import {
  IThemeProvider,
  IThemeDefinition,
  ColorMode,
  ThemeProviderType,
  IThemeContext,
} from '../types';
import { VSCodeThemeProvider } from '../providers/VSCodeThemeProvider';
import { UniversalColorMapper } from '../mapping/UniversalColorMapper';
import { CodeMirrorThemeInjector } from './CodeMirrorThemeInjector';

/**
 * Theme context for accessing theme state
 */
const ThemeContext = createContext<IThemeContext>({
  provider: null,
  theme: null,
  colorMode: 'light',
  setProvider: () => {},
  setColorMode: () => {},
});

/**
 * Hook to access theme context
 */
export function useTheme(): IThemeContext {
  return useContext(ThemeContext);
}

/**
 * Props for enhanced theme component
 * @hidden
 */
interface IEnhancedJupyterReactThemeProps {
  /**
   * Theme provider type
   */
  provider?: ThemeProviderType;

  /**
   * Initial color mode
   */
  colorMode?: ColorMode;

  /**
   * Custom theme definition
   */
  theme?: IThemeDefinition;

  /**
   * Custom theme provider instance
   */
  customProvider?: IThemeProvider;

  /**
   * Whether to load JupyterLab CSS
   */
  loadJupyterLabCss?: boolean;

  /**
   * Whether to inject CSS variables
   */
  injectCSSVariables?: boolean;

  /**
   * Children elements
   */
  children: React.ReactNode;
}

/**
 * CSS variable and style injector component
 *
 * @description Injects CSS variables and VS Code theme fixes into the document head.
 * For VS Code themes, automatically applies background color fixes to prevent black
 * background gaps in the notebook interface.
 *
 * @param variables - CSS variables to inject as :root styles
 * @param provider - Theme provider instance for additional CSS generation
 */
function CSSVariableInjector({
  variables,
  provider,
}: {
  variables: Record<string, string>;
  provider: IThemeProvider | null;
}) {
  useEffect(() => {
    // Create or update style element for variables
    let styleEl = document.getElementById(
      'enhanced-theme-variables',
    ) as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'enhanced-theme-variables';
      document.head.appendChild(styleEl);
    }

    // Generate CSS content
    const cssContent = Object.entries(variables)
      .map(([key, value]) => {
        // Ensure key starts with --
        const varName = key.startsWith('--') ? key : `--${key}`;
        return `${varName}: ${value};`;
      })
      .join('\n  ');

    let fullCSS = `:root {\n  ${cssContent}\n}`;

    // Force root elements to use VS Code editor background
    // This fixes black background gaps that appear between VS Code interface and notebook
    if (provider && provider.id === 'vscode-theme') {
      const vscodeColors = (provider as any)._vscodeColors as Map<
        string,
        string
      >;
      const editorBg =
        vscodeColors.get('--vscode-editor-background') ||
        variables['--theme-editor-background'] ||
        '#1e1e1e';

      // Use VS Code notebook cell background for CodeMirror editors (darker than main editor)
      const cellBg =
        vscodeColors.get('--vscode-notebook-cellEditorBackground') ||
        vscodeColors.get('--vscode-editor-background') ||
        variables['--theme-editor-background'] ||
        '#1e1e1e';

      fullCSS += `\n\n/* VS Code Root Background Fix - Eliminates black background gaps */\n`;
      fullCSS += `html, body, #notebook-editor { background-color: ${editorBg} !important; }\n`;
      fullCSS += `/* Fix Primer BaseStyles dark backgrounds that don't inherit VS Code theme */\n`;
      fullCSS += `.prc-src-BaseStyles-dl-St { background-color: ${editorBg} !important; }\n`;
      fullCSS += `/* Fix JupyterLab elements to match VS Code editor background */\n`;
      fullCSS += `.jp-Notebook, .jp-WindowedPanel { background-color: ${editorBg} !important; }\n`;
      fullCSS += `/* Use VS Code notebook cell background for CodeMirror editors */\n`;
      fullCSS += `.jp-CodeMirrorEditor, .cm-editor, .cm-content, .cm-focused { background-color: ${cellBg} !important; }\n`;
    }

    // Add CodeMirror-specific CSS if provider supports it
    if (provider && 'getCodeMirrorCSS' in provider) {
      const codeMirrorCSS = (provider as any).getCodeMirrorCSS();
      if (codeMirrorCSS) {
        fullCSS += `\n\n/* CodeMirror Syntax Highlighting */\n${codeMirrorCSS}`;
      }
    }

    styleEl.textContent = fullCSS;

    return () => {
      if (styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, [variables, provider]);

  return null;
}

/**
 * Enhanced JupyterReactTheme component
 */
export function EnhancedJupyterReactTheme({
  provider: providerType = 'auto',
  colorMode: initialColorMode = 'light',
  theme: customTheme,
  customProvider,
  loadJupyterLabCss = true,
  injectCSSVariables = true,
  children,
}: IEnhancedJupyterReactThemeProps): JSX.Element {
  const [themeProvider, setThemeProvider] = useState<IThemeProvider | null>(
    null,
  );
  const [currentTheme, setCurrentTheme] = useState<IThemeDefinition | null>(
    null,
  );
  const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode);
  const [primerTheme, setPrimerTheme] = useState<any>(null);
  const [cssVariables, setCssVariables] = useState<Record<string, string>>({});

  // Update color mode when prop changes (e.g., from VS Code theme changes)
  useEffect(() => {
    if (initialColorMode !== colorMode && initialColorMode !== 'auto') {
      console.log(
        '[EnhancedJupyterReactTheme] Color mode prop changed:',
        initialColorMode,
      );
      setColorMode(initialColorMode);
    }
  }, [initialColorMode]);

  // Initialize theme provider
  useEffect(() => {
    let provider: IThemeProvider | null = null;
    let disposable: IDisposable | null = null;

    const initializeProvider = () => {
      // Clean up previous provider
      if (provider) {
        provider.dispose();
      }

      // Determine which provider to use
      if (customProvider) {
        provider = customProvider;
      } else if (
        providerType === 'vscode' ||
        (providerType === 'auto' && detectVSCodeEnvironment())
      ) {
        console.log('[EnhancedJupyterReactTheme] Using VS Code theme provider');
        provider = new VSCodeThemeProvider(colorMode);
      } else {
        // For now, fall back to no provider (use default JupyterReactTheme behavior)
        console.log('[EnhancedJupyterReactTheme] Using default theme behavior');
        return;
      }

      // Set up the provider
      if (provider) {
        setThemeProvider(provider);

        // Subscribe to theme changes
        disposable = provider.subscribeToChanges(() => {
          console.log('[EnhancedJupyterReactTheme] Theme provider changed');
          updateTheme(provider);
        });

        // Initial theme update
        updateTheme(provider);
      }
    };

    const updateTheme = (provider: IThemeProvider) => {
      const theme = provider.getThemeDefinition();
      const primerMapping = provider.mapToPrimer();
      const variables = provider.getCSSVariables();

      setCurrentTheme(theme);
      setPrimerTheme(primerMapping);
      setCssVariables(variables);
      setColorMode(provider.getColorMode());

      console.log('[EnhancedJupyterReactTheme] Theme updated:', {
        theme: theme.name,
        colorMode: provider.getColorMode(),
        variableCount: Object.keys(variables).length,
      });
    };

    initializeProvider();

    return () => {
      if (disposable) {
        disposable.dispose();
      }
      if (provider) {
        provider.dispose();
      }
    };
  }, [providerType, customProvider]);

  // Force refresh when color mode changes
  useEffect(() => {
    if (themeProvider && themeProvider.id === 'vscode-theme') {
      console.log(
        '[EnhancedJupyterReactTheme] Triggering VS Code provider refresh for color mode:',
        colorMode,
      );
      (themeProvider as any).refresh?.();
    }
  }, [colorMode, themeProvider]);

  // Update color mode when it changes externally
  useEffect(() => {
    if (themeProvider && themeProvider.getColorMode() !== colorMode) {
      console.log('[EnhancedJupyterReactTheme] Syncing color mode:', colorMode);
      // If the provider supports setting color mode, do it here
      // For now, we'll just update our local state
    }
  }, [colorMode, themeProvider]);

  // Memoize context value
  const contextValue = useMemo<IThemeContext>(
    () => ({
      provider: themeProvider,
      theme: currentTheme,
      colorMode,
      setProvider: setThemeProvider,
      setColorMode,
    }),
    [themeProvider, currentTheme, colorMode],
  );

  // Render with appropriate theme
  return (
    <ThemeContext.Provider value={contextValue}>
      {injectCSSVariables && Object.keys(cssVariables).length > 0 && (
        <>
          <CSSVariableInjector
            variables={cssVariables}
            provider={themeProvider}
          />
          <CodeMirrorThemeInjector provider={themeProvider} />
        </>
      )}
      <JupyterReactTheme
        colormode={colorMode === 'dark' ? 'dark' : 'light'}
        loadJupyterLabCss={loadJupyterLabCss}
        theme={primerTheme || undefined}
      >
        {children}
      </JupyterReactTheme>
    </ThemeContext.Provider>
  );
}

/**
 * Detect if running in VS Code environment
 */
function detectVSCodeEnvironment(): boolean {
  // Check for VS Code-specific CSS variables
  const style = getComputedStyle(document.documentElement);
  const hasVSCodeVar = !!style.getPropertyValue('--vscode-editor-background');

  // Check for VS Code API
  const hasVSCodeAPI = typeof (window as any).acquireVsCodeApi !== 'undefined';

  return hasVSCodeVar || hasVSCodeAPI;
}

/**
 * Detect if running in JupyterLab environment
 */
function detectJupyterLabEnvironment(): boolean {
  // Check for JupyterLab-specific CSS variables
  const style = getComputedStyle(document.documentElement);
  const hasJupyterVar = !!style.getPropertyValue('--jp-layout-color0');

  // Check for JupyterLab body class
  const hasJupyterClass = document.body.classList.contains('jp-Notebook');

  return hasJupyterVar || hasJupyterClass;
}

export default EnhancedJupyterReactTheme;
