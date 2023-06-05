import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import LuminoToolbar from './lumino/LuminoToolbar';
import Layers from './../layout/Layers';
import LuminoComponent from './lumino/LuminoComponent';

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
