import {render} from 'react-dom';
import {Text} from '@primer/react';
import {Jupyter} from '@datalayer/jupyter-react';
import Gallery from './gallery/ComponentsGallery';

import './../index.css';

const div = document.createElement('div');
document.body.appendChild(div);

const Header = () => (
  <>
    <Text as="h4">Jupyter UI Components Examples</Text>
  </>
);

render(
  <Jupyter collaborative={true} terminals={true}>
    <Header />
    <Gallery />
  </Jupyter>,
  div
);
