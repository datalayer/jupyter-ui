import {render} from 'react-dom';
import {Jupyter, Notebook} from '@datalayer/jupyter-react';
import NotebookSimpleToolbar from './notebook/NotebookToolbarSimple';
import Layers from './../layout/Layers';

import './../App.css';

const NOTEBOOK_UID = 'notebook-uid-example';

/**
 * A simple example for the Jupyter UI.
 */
const Example = () => {
  return (
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <NotebookSimpleToolbar notebookId={NOTEBOOK_UID} />
      <Notebook uid={NOTEBOOK_UID} path="ping.ipynb" />
    </Jupyter>
  );
};

const div = document.createElement('div');
document.body.appendChild(div);

render(<Example />, div);
