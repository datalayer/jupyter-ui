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
export const useExampleThemeStore = createThemeStore(
  'jupyter-react-examples-theme',
  {
    colorMode: 'light',
    theme: 'datalayer',
  },
);

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
