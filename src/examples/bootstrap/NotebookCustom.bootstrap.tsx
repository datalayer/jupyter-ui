import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import NotebookExample from '../examples/notebook/NotebookExample';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
     <NotebookExample/>
  </ThemeProvider>
  ,
  div
);
