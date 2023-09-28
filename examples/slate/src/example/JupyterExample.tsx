import { Jupyter } from '@datalayer/jupyter-react';
import { CacheProvider } from '@emotion/react';
import { StylesProvider } from '@mui/styles';
import { ThemeProvider } from '@mui/material/styles';
import EditorExample from './EditorExample';
import setupMui from '../MuiSetup';
import theme from './theme';

const { jss, cache } = setupMui('datalayer-jss-insertion-point');

const JupyterExample = () => {
  return (
    <ThemeProvider theme={theme}>
      <CacheProvider value={cache}>
        <StylesProvider jss={jss}>
          <Jupyter
//            jupyterServerHttpUrl="http://localhost:3266/api/jupyter"
//            jupyterServerWsUrl="ws://localhost:3266/api/jupyter"
            collaborative={false}
            terminals={false}
          >
            <EditorExample/>
          </Jupyter>
        </StylesProvider>
      </CacheProvider>
    </ThemeProvider>
  );
}

export default JupyterExample;
