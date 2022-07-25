import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter } from '@datalayer/jupyter-react';
import muiLightTheme from '../theme/Theme';
import LuminoToolbar from './LuminoToolbar';
import Layers from '../theme/Layers';
import LuminoComponent from './LuminoComponent';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <LuminoToolbar/>
      <LuminoComponent/>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
