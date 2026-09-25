/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { createThemeStore } from '@datalayer/primer-addons';
import { themeConfigs, useSystemColorMode } from '@datalayer/primer-addons';

/**
 * Shared theme store for jupyter-react examples.
 *
 * Persisted in localStorage so standalone example pages and the examples
 * selector shell stay aligned on refresh.
 */
// Annotated through `createThemeStore` rather than inferred: the inferred type
// names zustand from inside `@datalayer/primer-addons`, which is not portable
// when that package carries its own copy (TS2742).
export const useExampleThemeStore: ReturnType<typeof createThemeStore> =
  createThemeStore('jupyter-react-examples-theme', {
    colorMode: 'light',
    theme: 'datalayer',
  });

/**
 * Resolve colormode and background color for standalone examples so each page
 * can pass consistent theme props to JupyterReactTheme.
 */
export const useExampleThemeSettings = () => {
  const { colorMode, theme: themeVariant } = useExampleThemeStore();
  const systemMode = useSystemColorMode();
  const resolvedMode = colorMode === 'auto' ? systemMode : colorMode;
  const themeConfig = themeConfigs[themeVariant];
  const modeStyles =
    resolvedMode === 'dark'
      ? themeConfig.themeStyles.dark
      : themeConfig.themeStyles.light;
  const backgroundColor =
    (modeStyles as Record<string, string>).backgroundColor ?? undefined;

  return {
    colorMode,
    themeConfig,
    resolvedMode,
    backgroundColor,
  };
};

export default useExampleThemeStore;
