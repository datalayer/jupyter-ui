/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button, Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import { useJupyter } from '../jupyter';
import { JupyterReactTheme } from '../theme/JupyterReactTheme';
import { CellSidebarExtension } from '../components';
import { Notebook } from '../components/notebook/Notebook';

const PATH_1 = 'ipywidgets.ipynb';

const PATH_2 = 'matplotlib.ipynb';

const NotebookPathChangeExample = () => {
  const { serviceManager, defaultKernel } = useJupyter({
    startDefaultKernel: true,
  });
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
      {serviceManager && defaultKernel && (
        <Notebook
          id="notebook-path-change-id"
          kernel={defaultKernel}
          serviceManager={serviceManager}
          path={path}
          height="calc(100vh - 2.6rem)" // (Height - Toolbar Height).
          extensions={extensions}
        />
      )}
    </JupyterReactTheme>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div);

root.render(<NotebookPathChangeExample />);
