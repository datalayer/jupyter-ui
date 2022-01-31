import { render } from 'react-dom';
import Typography from '@mui/material/Typography';
import { CacheProvider } from '@emotion/react';
import { StylesProvider } from '@mui/styles';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
import setupMui from '../MuiSetup';
import Gallery from '../examples/gallery/GalleryExample';

const { jss, cache } = setupMui('datalayer-jss-insertion-point');

const div = document.createElement('div');
document.body.appendChild(div);

const Header = () =>  <>
    <Typography variant="h4" gutterBottom>
      Jupyter React Gallery
    </Typography>
    <Typography variant="subtitle1" gutterBottom>
      © Datalayer, 2022
    </Typography>
  </>

render(
  <ThemeProvider theme={muiLightTheme}>
    <CacheProvider value={cache}>
      <StylesProvider jss={jss}>
        <Jupyter collaborative={true} terminals={true}>
          <Header/>
          <Gallery/>
        </Jupyter>
      </StylesProvider>
    </CacheProvider>
  </ThemeProvider>
  ,
  div
);
