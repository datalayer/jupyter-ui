import { createRoot } from 'react-dom/client';
import { INotebookContent } from '@jupyterlab/nbformat';
import { Box, Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import Viewer from '../components/viewer/Viewer';

import notebookExample from "./notebooks/IPyWidgetsExample1.ipynb.json";

import "./../../style/index.css";

const ViewerExample = () => (
  <>
    <Box m={3}>
      <Jupyter>
        <Text as="h3">Viewer Example</Text>
        <Viewer nbformat={notebookExample as INotebookContent} />
      </Jupyter>
    </Box>
  </>
)

const div = document.createElement('div');
document.body.appendChild(div);
const root = createRoot(div)

root.render(
  <ViewerExample/>
);
