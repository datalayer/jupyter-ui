import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import Layers from '../theme/Layers';
import FileBrowserTree from '../../components/filebrowser/FileBrowserTree';
import FileBrowser from '../../components/filebrowser/FileBrowser';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <Jupyter collaborative={false} terminals={true}>
        <FileBrowserTree/>
        <FileBrowser/>
      </Jupyter>
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
