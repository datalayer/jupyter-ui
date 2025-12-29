/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { INotebookContent } from '@jupyterlab/nbformat';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { Notebook2 } from '../components/notebook/Notebook2';
import { NotebookToolbar } from '../components/notebook/toolbar/NotebookToolbar';
import { TocExtension } from './extensions/toc/TocExtension';
import { ReactLayoutFactory } from './extensions/toc/ReactLayoutFactory';
import { JupyterLayoutFactory } from './extensions/toc/JupyterLayoutFactory';

import NBFORMAT from './notebooks/NotebookToCExample.ipynb.json';

const NotebookTOCExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
  const [layout, setLayout] = useState<'react' | 'jupyter'>('jupyter');
  const extensions = useMemo(
    () => [
      new TocExtension({
        factory:
          layout === 'react'
            ? new ReactLayoutFactory()
            : new JupyterLayoutFactory(),
      }),
    ],
    [layout]
  );
  return (
    <JupyterReactTheme>
      <Box>
        <Button
          onClick={() => {
            setLayout(layout === 'react' ? 'jupyter' : 'react');
          }}
        >
          Use {layout === 'react' ? 'Jupyter' : 'React'} Layout
        </Button>
      </Box>
      {serviceManager && defaultKernel && (
        <Notebook2
          kernel={defaultKernel}
          serviceManager={serviceManager}
          nbformat={NBFORMAT as INotebookContent}
          key={layout}
          extensions={extensions}
          id="notebook-toc-id"
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          Toolbar={NotebookToolbar}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookTOCExample />);
