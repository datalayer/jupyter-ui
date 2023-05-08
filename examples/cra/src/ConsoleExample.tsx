import {render} from 'react-dom';
import {Jupyter, Console} from '@datalayer/jupyter-react';
import Layers from './examples/theme/Layers';
import ConsoleToolbar from './examples/console/ConsoleToolbar';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <ConsoleToolbar />
    <Console />
  </Jupyter>,
  div
);
