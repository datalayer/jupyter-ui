import { render } from 'react-dom';
import { Text } from '@primer/react';
import Jupyter from '../jupyter/Jupyter';
import OutputIPyWidgets from '../components/output/OutputIPyWidgets';

import { view, state } from './notebooks/OutputIPyWidgetsExample';

const Example = () => {
  return (
    <>
      <Text as="h1">Output IPyWidgets</Text>
      <OutputIPyWidgets view={view} state={state}/>
    </>
  )
}

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter>
    <Example/>
  </Jupyter>
  ,
  div
);
