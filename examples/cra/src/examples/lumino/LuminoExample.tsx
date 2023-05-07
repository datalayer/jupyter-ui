import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import LuminoToolbar from './LuminoToolbar';
import Layers from '../theme/Layers';
import LuminoComponent from './LuminoComponent';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <LuminoToolbar />
    <LuminoComponent />
  </Jupyter>,
  div
);
