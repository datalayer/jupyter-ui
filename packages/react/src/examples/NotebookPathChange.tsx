/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { Box, Button, Text } from '@primer/react';
import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';

const PATH_1 = 'ipywidgets.ipynb';

const PATH_2 = 'matplotlib.ipynb';

const NotebookPathChangeExample = () => {
  const [path, setPath] = useState<string>(PATH_1);
  const extensions = useMemo(() => [new CellSidebarExtension()], []);
  const changePath = () => {
    if (path === PATH_1) {
      setPath(PATH_2);
    } else {
      setPath(PATH_1);
    }
  };
  return (
    <JupyterReactTheme>
      <Box display="flex">
        <Button variant="default" size="small" onClick={changePath}>
          Change Notebook Path
        </Button>
      </Box>
      <Box mt={2}>
        <Text
          as="span"
          sx={{ color: 'fg.onEmphasis', bg: 'neutral.emphasis', p: 2 }}
        >
          {path}
        </Text>
      </Box>
      <Notebook
        path={path}
        id="notebook-path-change-id"
        height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
        extensions={extensions}
      />
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookPathChangeExample />);
