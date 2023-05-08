import {render} from 'react-dom';
import {Jupyter, FileBrowser} from '@datalayer/jupyter-react';
import FileBrowserTree from '../components/FileBrowserTree';
import Layers from './theme/Layers';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter collaborative={false} terminals={false}>
    <Layers />
    <Jupyter collaborative={false} terminals={true}>
      <FileBrowserTree />
      <FileBrowser />
    </Jupyter>
  </Jupyter>,
  div
);
