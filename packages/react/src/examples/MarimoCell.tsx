/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * Marimo cells: three `Cell` components on one kernel, `variant="marimo"`.
 *
 * They share the kernel's reactive graph, so they react to each other the
 * way a notebook's cells do: run the first cell, then edit its `radius` and
 * run it again — the area and the report cells run again on their own.
 */

import { createRoot } from 'react-dom/client';
import { Button, Text } from '@primer/react';
import { Box, DatalayerThemeProvider } from '@datalayer/primer-addons';
import { PlayIcon } from '@primer/octicons-react';
import { JupyterReactTheme } from '../theme';
import { useJupyter } from '../jupyter/JupyterUse';
import { KernelIndicator } from '../components/kernel/KernelIndicator';
import { Cell } from '../components/cell/Cell';
import { useCellsStore } from '../components/cell/CellState';
import { useExampleThemeSettings } from './themeStore';

const CELLS: Array<{ id: string; source: string; title: string }> = [
  {
    id: 'marimo-cell-radius',
    title: 'Defines radius',
    source: 'radius = 2',
  },
  {
    id: 'marimo-cell-area',
    title: 'Reads radius, defines area',
    source: 'import math\narea = math.pi * radius ** 2\narea',
  },
  {
    id: 'marimo-cell-report',
    title: 'Reads both',
    source: 'print(f"A circle of radius {radius} has an area of {area:.2f}")',
  },
];

const MarimoCellExample = () => {
  const { defaultKernel } = useJupyter({ startDefaultKernel: true });
  const cellsStore = useCellsStore();
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
        <Box as="h1">Marimo Cells</Box>
        <Text as="p">
          Three cells on one kernel, reactive: run the first, change its radius
          and run it again — the two below run again on their own.
        </Text>
        <Box>
          <KernelIndicator
            kernel={defaultKernel?.connection}
            label="Marimo kernel"
            variant="marimo"
            position="sw"
            bordered={false}
          />
        </Box>
        {defaultKernel &&
          CELLS.map(cell => (
            <Box key={cell.id} sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Text sx={{ fontWeight: 'bold' }}>{cell.title}</Text>
                <Button
                  size="small"
                  leadingVisual={() => <PlayIcon />}
                  onClick={() => cellsStore.execute(cell.id)}
                >
                  Run
                </Button>
              </Box>
              <Cell
                id={cell.id}
                source={cell.source}
                kernel={defaultKernel}
                autoStart={false}
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

root.render(<MarimoCellExample />);
