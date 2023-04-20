import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter } from '@datalayer/jupyter-react';
import muiLightTheme from '../theme/Theme';
import Layers from '../theme/Layers';
import OutputsToolbar from './OutputsToolbar';
import OutputsComponents from './OutputsComponents';

import "./../index.css";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <OutputsToolbar/>
      <OutputsComponents />
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
