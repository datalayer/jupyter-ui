import {render} from 'react-dom';
import {Jupyter} from '@datalayer/jupyter-react';
import Layers from './theme/Layers';
import OutputsToolbar from './outputs/OutputsToolbar';
import OutputsComponents from './outputs/OutputsComponents';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <OutputsToolbar />
    <OutputsComponents />
  </Jupyter>,
  div
);
