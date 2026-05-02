/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import {
  themeConfigs,
  type ThemeState,
  useSystemColorMode,
} from '@datalayer/primer-addons';

export interface PrimerThemeStoreLike {
  (): ThemeState;
  getState: () => ThemeState;
}

/**
 * Shared bridge between primer-addons theme store and jupyter-react/lexical.
 */
export function usePrimerThemeBridge(useStore: PrimerThemeStoreLike) {
  const { colorMode, theme: themeVariant } = useStore();
  const systemMode = useSystemColorMode();
  const resolvedMode = colorMode === 'auto' ? systemMode : colorMode;
  const themeConfig = themeConfigs[themeVariant];
  const modeStyles =
    resolvedMode === 'dark'
      ? themeConfig.themeStyles.dark
      : themeConfig.themeStyles.light;
  const themeBackground =
    (modeStyles as Record<string, string>).backgroundColor ?? '';

  return {
    colorMode,
    themeVariant,
    resolvedMode,
    themeConfig,
    themeBackground,
    lexicalTheme: (resolvedMode === 'dark' ? 'dark' : 'light') as
      | 'light'
      | 'dark',
  };
}

export default usePrimerThemeBridge;
