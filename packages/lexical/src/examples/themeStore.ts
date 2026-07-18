/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import { createThemeStore } from '@datalayer/primer-addons';

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

export default useExampleThemeStore;
