import {render} from 'react-dom';
import {Jupyter, Terminal} from '@datalayer/jupyter-react';
import TerminalToolbar from './terminal/TerminalToolbar';
import Layers from './../layout/Layers';

import './../App.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={true}>
    <Layers />
    <TerminalToolbar />
    <Terminal />
  </Jupyter>,
  div
);
