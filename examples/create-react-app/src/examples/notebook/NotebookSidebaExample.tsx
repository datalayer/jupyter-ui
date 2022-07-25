import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import NotebookSidebarComponent from './NotebookSidebarComponent';

import "./../index.css";

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
     <NotebookSidebarComponent/>
  </ThemeProvider>
  ,
  div
);
