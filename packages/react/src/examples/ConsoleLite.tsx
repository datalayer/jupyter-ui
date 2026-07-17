/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import Console from '../components/console/Console';
import { useExampleThemeSettings } from './themeStore';

const ConsoleLiteExample = () => {
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();

  return (
    <DatalayerThemeProvider
      colorMode={colorMode}
      theme={themeConfig.primerTheme}
      themeStyles={themeConfig.themeStyles}
    >
      <JupyterReactTheme colormode={resolvedMode} backgroundColor={backgroundColor}>
        <Box as="h1">Console with a Lite Kernel</Box>
        <Console
          code={`import micropip
await micropip.install('numpy')
import numpy, sys
print(f'👋 Hello Jupyter Console with a Lite Kernel - Platform: {sys.platform} - IPython: {get_ipython()}") - numpy {numpy.__version__}')`}
        />
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(
  <ConsoleLiteExample />
);
