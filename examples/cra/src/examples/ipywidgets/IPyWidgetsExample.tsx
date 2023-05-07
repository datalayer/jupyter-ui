import {render} from 'react-dom';
import {Jupyter, IpyWidgetsComponent} from '@datalayer/jupyter-react';
import IPyWidgetsSimple from './IPyWidgetsSimple';
import IpyWidgetsToolbar from './IpyWidgetsToolbar';
import Layers from '../theme/Layers';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <IpyWidgetsToolbar />
    <IpyWidgetsComponent Widget={IPyWidgetsSimple} />
  </Jupyter>,
  div
);
