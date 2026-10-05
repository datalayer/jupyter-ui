/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * What the two `KernelVariables` examples share: the notebook they open,
 * with a variable of each kind the renderers draw, and the layout — the
 * notebook, and the kernel's variables beside it.
 */

import type { ReactElement } from 'react';
import { INotebookContent } from '@jupyterlab/nbformat';
import { ServiceManager } from '@jupyterlab/services';
import { Heading, Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { Notebook } from '../../components/notebook/Notebook';
import { KernelIndicator } from '../../components/kernel/KernelIndicator';
import { KernelVariables } from '../../components/kernel/KernelVariables';
import type Kernel from '../../jupyter/kernel/Kernel';

const code = (id: string, source: string) => ({
  cell_type: 'code',
  id,
  metadata: {},
  execution_count: null,
  outputs: [],
  source,
});

/** A notebook with a variable of each kind: run its cells, one by one. */
export function kernelVariablesNotebook(
  options: { widgets?: boolean } = {}
): INotebookContent {
  const cells = [
    code(
      'scalars',
      'a = 1\nratio = 0.75\nname = "Jupyter"\nitems = [1, 2, 3, "four"]\nconfig = {"rows": 3, "cols": 2, "title": "demo"}'
    ),
    code('numpy', 'import numpy as np\narr = np.arange(12).reshape(3, 4)'),
    code(
      'pandas',
      'import pandas as pd\ndf = pd.DataFrame({"x": [1, 2, 3], "y": ["a", "b", "c"], "z": [0.1, 0.2, 0.3]})\nseries = df["z"]\ndf'
    ),
    code(
      'matplotlib',
      'import matplotlib.pyplot as plt\nfig, ax = plt.subplots(figsize=(3, 2))\nax.plot([1, 3, 2])\nax.set_title("A figure")'
    ),
    code(
      'functions',
      'def double(x: int) -> int:\n    """Twice x."""\n    return 2 * x\n\nclass Point:\n    """A point."""\n    pass'
    ),
  ];
  if (options.widgets !== false) {
    cells.push(
      code(
        'widgets',
        'import ipywidgets as widgets\nslider = widgets.IntSlider(value=5, max=10, description="slider")\ncolor = widgets.ColorPicker(value="#2f81f7", description="color")\nwidgets.VBox([slider, color])'
      ),
      code('widget-value', 'slider.value')
    );
  }
  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        name: 'python3',
        display_name: 'Python 3',
        language: 'python',
      },
      language_info: { name: 'python' },
    },
    cells,
  } as INotebookContent;
}

export function KernelVariablesLayout({
  title,
  description,
  notebookId,
  nbformat,
  kernel,
  serviceManager,
}: {
  title: string;
  description: string;
  notebookId: string;
  nbformat: INotebookContent;
  kernel?: Kernel;
  serviceManager?: ServiceManager.IManager;
}): ReactElement {
  return (
    <Box sx={{ p: 3, pr: '352px' }}>
      <Heading as="h2" sx={{ fontSize: 3, mb: 1 }}>
        {title}
      </Heading>
      <Text as="p" sx={{ color: 'fg.muted', mt: 0 }}>
        {description}
      </Text>
      <Box
        sx={{
          display: 'flex',
          width: '100%',
          gap: 3,
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
          {kernel && serviceManager ? (
            <Notebook
              id={notebookId}
              kernel={kernel}
              serviceManager={serviceManager}
              nbformat={nbformat}
              height="calc(100vh - 160px)"
            />
          ) : (
            <Text sx={{ color: 'fg.muted' }}>Starting the kernel…</Text>
          )}
        </Box>
        <Box
          as="aside"
          aria-label="Kernel variables"
          sx={{
            flex: '0 0 380px',
            minWidth: 0,
            border: '1px solid',
            borderColor: 'border.default',
            borderRadius: 2,
            p: 2,
            bg: 'canvas.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Heading as="h3" sx={{ fontSize: 2, flex: 1, m: 0 }}>
              Variables
            </Heading>
            <KernelIndicator kernel={kernel?.connection} />
          </Box>
          <KernelVariables kernel={kernel} maxHeight="calc(100vh - 260px)" />
        </Box>
      </Box>
    </Box>
  );
}
