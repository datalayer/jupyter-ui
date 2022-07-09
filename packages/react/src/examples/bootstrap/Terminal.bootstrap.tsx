import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import Terminal from '../../components/terminal/Terminal';
import TerminalControl from '../controls/TerminalControl';
import Layers from '../theme/Layers';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={true}>
      <Layers/>
      <TerminalControl/>
      <Terminal/>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
