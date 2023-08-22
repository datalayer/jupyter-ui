import { useState } from "react";
import { createRoot } from 'react-dom/client';
import { Box, Button, ButtonGroup, Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Notebook from '../components/notebook/Notebook';
import CellSidebarDefault from '../components/notebook/cell/sidebar/CellSidebarDefault';

import "./../../style/index.css";

const NOTEBOOK_UID = 'notebook-path-change-id';

const PATH_1 = "ipywidgets.ipynb";
const PATH_2 = "panel.ipynb";

const NotebookModelChange = () => {
  const [path, setPath] = useState<string>(PATH_1);
  const changePath = () => {
    path === PATH_1 ? setPath(PATH_2) : setPath(PATH_1);
  }
  return (
    <>
      <Box display="flex">
        <ButtonGroup>
          <Button
            variant="default"
            size="small"
            onClick={changePath}
            >
            Change Path
          </Button>
        </ButtonGroup>
      </Box>
      <Box>
        <Text>Current path: {path}</Text>
      </Box>
      <Notebook
        uid={NOTEBOOK_UID}
        path={path}
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
    <NotebookModelChange />
  </Jupyter>
);
