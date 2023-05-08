import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import CellComponents from './examples/cell/CellComponents';
import Layers from './examples/theme/Layers';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <CellComponents />
  </Jupyter>,
  div
);
