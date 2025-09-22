/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/**
 * @module theme
 * Extensible theme system for Jupyter React in VS Code.
 * Provides support for VS Code themes, JupyterLab themes, and custom themes.
 */

// Export types
export * from './types';

// Export providers
export { BaseThemeProvider } from './providers/BaseThemeProvider';
export { VSCodeThemeProvider } from './providers/VSCodeThemeProvider';

// Export mapping utilities
export { UniversalColorMapper } from './mapping/UniversalColorMapper';

// Export components
export {
  EnhancedJupyterReactTheme,
  useTheme,
} from './components/EnhancedJupyterReactTheme';

// Re-export the default
export { default as ThemeProvider } from './components/EnhancedJupyterReactTheme';
