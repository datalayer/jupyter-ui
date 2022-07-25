import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import { Jupyter, Console } from '@datalayer/jupyter-react';
import Layers from '../theme/Layers';
import ConsoleToolbar from './ConsoleToolbar';

import "./../index.css";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter
      collaborative={false}
      terminals={false}
    >
      <Layers />
      <ConsoleToolbar />
      <Console />
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
