import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import LuminoExample from './../examples/lumino/LuminoExample';
import Jupyter from './../../jupyter/Jupyter';
import LuminoControl from '../controls/LuminoControl';
import Layers from './../theme/Layers';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <LuminoControl/>
      <LuminoExample/>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
