import { render } from 'react-dom';
import { ThemeProvider } from '@mui/material/styles';
import muiLightTheme from '../theme/Theme';
import Jupyter from '../../jupyter/Jupyter';
// import IpyWidgetsComponent from '../../widgets/ipywidgets/IpyWidgetsComponent';
// import IpyWidgetsExample from '../components/ipywidgets/IpyWidgetsExample';
import IpyWidgetsControl from '../controls/IpyWidgetsControl';
import Layers from '../theme/Layers';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <ThemeProvider theme={muiLightTheme}>
    <Jupyter collaborative={false} terminals={false}>
      <Layers />
      <IpyWidgetsControl/>
      {/*
      <IpyWidgetsComponent widget={IpyWidgetsExample}/>
      */}
    </Jupyter>
  </ThemeProvider>
  ,
  div
);
