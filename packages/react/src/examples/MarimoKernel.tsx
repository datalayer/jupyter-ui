/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * A Marimo kernel: a `Kernel` made with `variant: 'marimo'`.
 *
 * Everything on such a kernel is reactive without saying so itself — the
 * cells below carry no `variant` — and the kernel exposes the graph: which
 * names each cell defines and reads, who depends on whom. The graph is
 * Marimo's, kept in the kernel and asked over the Jupyter protocol.
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Text } from '@primer/react';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter';
import { Kernel } from '../jupyter/kernel/Kernel';
import type { MarimoGraph } from '../jupyter/marimo/reactive';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { Cell } from '../components/cell/Cell';
import { useExampleThemeSettings } from './themeStore';

const CELLS: Array<{ id: string; source: string }> = [
  { id: 'marimo-kernel-a', source: 'a = 1' },
  { id: 'marimo-kernel-b', source: 'b = a + 1\nb' },
  { id: 'marimo-kernel-c', source: 'c = a * b\nc' },
];

const MarimoKernelExample = () => {
  const { serviceManager, kernelManager } = useJupyter();
  const [kernel, setKernel] = useState<Kernel>();
  const [graph, setGraph] = useState<MarimoGraph>();
  const { colorMode, themeConfig, resolvedMode, backgroundColor } =
    useExampleThemeSettings();

  useEffect(() => {
    if (!serviceManager || !kernelManager || kernel) {
      return;
    }
    const marimoKernel = new Kernel({
      kernelManager,
      kernelName: 'marimoKernel',
      kernelSpecName: 'python',
      kernelspecsManager: serviceManager.kernelspecs,
      sessionManager: serviceManager.sessions,
      variant: 'marimo',
    });
    void marimoKernel.ready.then(() => setKernel(marimoKernel));
  }, [serviceManager, kernelManager, kernel]);

  const showGraph = () => {
    void kernel?.marimo?.graph().then(setGraph);
  };

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
        <Box as="h1">Marimo Kernel</Box>
        <Text as="p">
          A kernel made with <code>variant: &apos;marimo&apos;</code>: the cells
          on it are reactive without a variant of their own. Run them, then ask
          the kernel for its graph.
        </Text>
        <Box>
          <KernelIndicator
            kernel={kernel?.connection}
            label="Kernel"
            variant={kernel?.variant}
          />
        </Box>
        {kernel &&
          CELLS.map(cell => (
            <Box key={cell.id} sx={{ mt: 2 }}>
              <Cell
                id={cell.id}
                source={cell.source}
                kernel={kernel}
                autoStart={false}
              />
            </Box>
          ))}
        <Box sx={{ mt: 3 }}>
          <Button onClick={showGraph} disabled={!kernel}>
            Show the reactive graph
          </Button>
        </Box>
        {graph ? (
          <Box as="pre" sx={{ mt: 2, fontSize: 0 }}>
            {JSON.stringify(graph, null, 2)}
          </Box>
        ) : null}
      </JupyterReactTheme>
    </DatalayerThemeProvider>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<MarimoKernelExample />);
