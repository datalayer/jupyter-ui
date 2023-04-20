import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter, Notebook } from '@datalayer/jupyter-react';
import muiLightTheme from '../theme/Theme';
import NotebookSimpleToolbar from './NotebookSimpleToolbar';
import Layers from '../theme/Layers'

import "./../index.css";

const NOTEBOOK_UID = 'notebook-uid-example';

/**
 * A simple example for the Jupyter UI.
 */
const Example = () => {
  return (
    <ThemeProvider theme={muiLightTheme}>
      <Jupyter collaborative={false} terminals={false}>
        <Layers />
        <NotebookSimpleToolbar notebookId={NOTEBOOK_UID}/>
        <Notebook
          uid={NOTEBOOK_UID}
          path='ping.ipynb'
          ipywidgets='classic'
        />
      </Jupyter>
    </ThemeProvider>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Example/>
  ,
  div
);
