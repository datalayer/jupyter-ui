import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import Layers from '../theme/Layers';
import CellExample from './../components//cell/CellExample';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter
      collaborative={false}
      terminals={false}
    >
      <Layers />
      <CellExample />
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
