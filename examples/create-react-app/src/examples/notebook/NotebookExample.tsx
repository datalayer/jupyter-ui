import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter, Notebook } from '@datalayer/jupyter-react';
import muiLightTheme from '../theme/Theme';
import NotebookSimpleToolbar from './NotebookSimpleToolbar';
import Layers from '../theme/Layers'

import "./../index.css";

/**
 * A simple example for the Jupyter React.
 */
const Example = () => {
  return (
    <ThemeProvider theme={muiLightTheme}>
      <Jupyter collaborative={false} terminals={false}>
        <Layers />
        <NotebookSimpleToolbar />
        <Notebook
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
