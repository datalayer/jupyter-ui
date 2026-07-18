/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { createThemeStore } from '@datalayer/primer-addons';
import { themeConfigs, useSystemColorMode } from '@datalayer/primer-addons';

/**
 * Shared theme store for jupyter-lexical examples.
 *
 * Mirrors the jupyter-react examples store: persisted in localStorage so all
 * example pages stay aligned on the selected theme and color mode.
 */
export const useExampleThemeStore = createThemeStore(
  'jupyter-lexical-examples-theme',
  {
    colorMode: 'light',
    theme: 'datalayer',
  },
);

/**
 * Resolve colormode/background from the shared lexical examples theme store.
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
    resolvedMode,
    themeConfig,
    backgroundColor,
  };
};

export default useExampleThemeStore;
