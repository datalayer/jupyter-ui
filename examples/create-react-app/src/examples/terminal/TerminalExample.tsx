import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter, Terminal } from '@datalayer/jupyter-react';
import muiLightTheme from '../theme/Theme';
import TerminalToolbar from './TerminalToolbar';
import Layers from '../theme/Layers';

import "./../index.css";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={true}>
      <Layers/>
      <TerminalToolbar/>
      <Terminal/>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
