import {Jupyter, Notebook} from '@datalayer/jupyter-react';
import NotebookToolbar from './NotebookToolbar';
import CellSidebarComponent from './CellSidebarComponent';
import {Box} from '@primer/react';

const NOTEBOOK_UID = 'notebook-id-simple';

export default function NotebookSidebarComponent() {
  return (
    <Jupyter collaborative={false} terminals={true}>
      <div style={{padding: '2rem'}}>
        <Box sx={{width: '100%'}}>
          <NotebookToolbar notebookId={NOTEBOOK_UID} />
          <Notebook
            uid={NOTEBOOK_UID}
            path="ping.ipynb"
            ipywidgets="lab"
            CellSidebar={CellSidebarComponent}
          />
        </Box>
      </div>
    </Jupyter>
  );
}
