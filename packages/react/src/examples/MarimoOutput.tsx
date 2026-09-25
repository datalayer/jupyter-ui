/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Marimo outputs: `Output` components with an editor, `variant="marimo"`.
 *
 * Each output registers its code in the kernel's reactive graph when it
 * runs. Run the first output, then edit its `base` and run it again: the
 * outputs that read `base` run again, in dependency order.
 */

import { createRoot } from 'react-dom/client';
import { Text } from '@primer/react';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { Output } from '../components/output/Output';
import { useExampleThemeSettings } from './themeStore';

const OUTPUTS: Array<{ id: string; code: string; title: string }> = [
  { id: 'marimo-output-base', title: 'Defines base', code: 'base = 21' },
  {
    id: 'marimo-output-double',
    title: 'Reads base, defines double',
    code: 'double = base * 2\ndouble',
  },
  {
    id: 'marimo-output-message',
    title: 'Reads double',
    code: 'f"Twice {base} is {double}"',
  },
];

const MarimoOutputExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
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
        <Box as="h1">Marimo Outputs</Box>
        <Text as="p">
          Outputs with an editor, reactive on one kernel: run the first, change
          its base and run it again — the outputs that read it run again.
        </Text>
        <Box>
          <KernelIndicator
            kernel={defaultKernel?.connection}
            label="Marimo kernel"
            variant="marimo"
          />
        </Box>
        {defaultKernel &&
          OUTPUTS.map(output => (
            <Box key={output.id} sx={{ mt: 3 }}>
              <Text sx={{ fontWeight: 'bold' }}>{output.title}</Text>
              <Output
                id={output.id}
                code={output.code}
                kernel={defaultKernel}
                showEditor
                autoRun={false}
                variant="marimo"
              />
            </Box>
          ))}
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<MarimoOutputExample />);
