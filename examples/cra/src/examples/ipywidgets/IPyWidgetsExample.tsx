import { render } from 'react-dom';
import { Jupyter, IPyWidgetsComponent } from '@datalayer/jupyter-react';
import IPyWidgetsSimple from './IPyWidgetsSimple';
import IPyWidgetsToolbar from './IPyWidgetsToolbar';
import Layers from '../../layout/Layers';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <IPyWidgetsToolbar />
    <IPyWidgetsComponent Widget={IPyWidgetsSimple} />
  </Jupyter>,
  div
);
