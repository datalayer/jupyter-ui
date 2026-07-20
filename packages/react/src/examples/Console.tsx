/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import Console from '../components/console/Console';
import { useExampleThemeSettings } from './themeStore';

const ConsoleExample = () => {
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();

  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme
        colormode={resolvedMode}
        backgroundColor={backgroundColor}
        useBaseStyles={false}
      >
        <Box as="h1">Console</Box>
        <Console code={"print('👋 Hello Jupyter Console')"} />
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<ConsoleExample />);
