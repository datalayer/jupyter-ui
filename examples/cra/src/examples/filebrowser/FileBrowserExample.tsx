import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import { Jupyter, FileBrowser } from '@datalayer/jupyter-react';
import FileBrowserTree from "../../components/FileBrowserTree";
import muiLightTheme from '../theme/Theme';
import Layers from '../theme/Layers';

import "./../index.css";

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
