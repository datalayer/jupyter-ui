import { INotebookContent } from '@jupyterlab/nbformat';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { NotebookToolbar } from '../components/notebook/toolbar/NotebookToolbar';
import { TocExtension } from './extensions/toc/TocExtension';
import { ReactLayoutFactory } from './extensions/toc/ReactLayoutFactory';
import nbformat from './notebooks/NotebookToCExample.ipynb.json';
import { Box, Button } from '@primer/react';
import { JupyterLayoutFactory } from './extensions/toc/JupyterLayoutFactory';

const NotebookToc = () => {
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
      <Notebook
        key={layout}
        nbformat={nbformat as INotebookContent}
        extensions={extensions}
        id="notebook-toc-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        Toolbar={NotebookToolbar}
        serverless
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookToc />);
