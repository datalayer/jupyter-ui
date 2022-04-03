import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import Layers from '../theme/Layers';
import FileBrowser from './../../components/filebrowser/FileBrowser';
import FileBrowserLumino from './../../components/filebrowser/FileBrowserLumino';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <Jupyter collaborative={false} terminals={true}>
        <FileBrowser/>
        <FileBrowserLumino/>
      </Jupyter>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
