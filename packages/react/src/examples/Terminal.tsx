/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { createRoot } from 'react-dom/client';
import { DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme';
import { Terminal } from '../components/terminal/Terminal';
import { useExampleThemeSettings } from './themeStore';

const TerminalExample = () => {
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
        <Terminal colormode={resolvedMode} height="800px" />
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<TerminalExample />);
