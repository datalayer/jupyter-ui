import { render } from 'react-dom';
import ExampleComponent from './ExampleComponent';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <>
    <ExampleComponent/>
  </>
  ,
  div
);
