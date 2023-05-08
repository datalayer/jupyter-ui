import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import CellComponents from './CellComponents';
import Layers from '../theme/Layers';

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
