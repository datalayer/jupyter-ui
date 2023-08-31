import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

const PATH_1 = "ipywidgets.ipynb";
const PATH_2 = "matplotlib.ipynb";

const NotebookPathChange = () => {
  const [path, setPath] = useState<string>(PATH_1);
  const changePath = () => {
    path === PATH_1 ? setPath(PATH_2) : setPath(PATH_1);
  }
  return (
    <>
      <Box display="flex">
        <Button
          variant="default"
          size="small"
          onClick={changePath}
          >
          Change Path
        </Button>
      </Box>
      <Box mt={2}>
        <Text as="span" sx={{color: 'fg.onEmphasis', bg: 'neutral.emphasis', p: 2}}>{path}</Text>
      </Box>
      <Notebook
        path={path}
        uid="notebook-path-change-id"
        externalIPyWidgets={[
          { name: "@widgetti/jupyter-react", version: "0.3.0" },
          { name: "bqplot", version: "0.5.42" },
          { name: "jupyter-matplotlib", version: "0.11.3" },
        ]}
        CellSidebar={CellSidebarDefault}
      />
    </>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <Jupyter>
    <NotebookPathChange />
  </Jupyter>
);