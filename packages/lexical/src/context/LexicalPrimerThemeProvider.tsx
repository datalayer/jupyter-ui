/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

/*
 * Copyright (c) 2021-2026 Datalayer, Inc.
 *
 * MIT License
 */

import type { PropsWithChildren } from 'react';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import {
  JupyterReactTheme,
  type PrimerThemeStoreLike,
  usePrimerThemeBridge,
} from '@datalayer/jupyter-react';
import { ThemeContext } from './ThemeContext';

export interface LexicalPrimerThemeProviderProps {
  useStore: PrimerThemeStoreLike;
}

/**
 * Bridge provider to apply primer-addons themes consistently to both
 * jupyter-react surfaces and lexical editor styling context.
 */
export function LexicalPrimerThemeProvider(
  props: PropsWithChildren<LexicalPrimerThemeProviderProps>,
): JSX.Element {
  const { useStore, children } = props;
  const {
    colorMode,
    resolvedMode,
    themeConfig,
    themeBackground,
    lexicalTheme,
  } = usePrimerThemeBridge(useStore);

  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme
        colormode={resolvedMode}
        backgroundColor={themeBackground}
      >
        <Box
          sx={{
            '& .editor-shell': {
              backgroundColor: themeBackground,
              borderRadius: 2,
            },
            '& .editor-container': {
              backgroundColor: themeBackground,
            },
            '& .editor-inner': {
              backgroundColor: themeBackground,
            },
            '& .editor-input': {
              backgroundColor: themeBackground,
            },
            '& [role="toolbar"][aria-label="Editor toolbar"]': {
              backgroundColor: themeBackground,
            },
          }}
        >
          <ThemeContext.Provider value={{ theme: lexicalTheme }}>
            {children}
          </ThemeContext.Provider>
        </Box>
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
}

export default LexicalPrimerThemeProvider;
