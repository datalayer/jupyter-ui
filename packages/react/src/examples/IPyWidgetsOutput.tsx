import { render } from 'react-dom';
import Jupyter from '../jupyter/Jupyter';
import IPyWidgetsOutput from '../components/ipywidgets/IPyWidgetsOutput';
import { view, state } from './samples/IPyWidgetsOutput';

const div = document.createElement('div');
document.body.appendChild(div);

render(
  <Jupyter startDefaultKernel={false} terminals={false}>
    <IPyWidgetsOutput view={view} state={state}/>
  </Jupyter>
  ,
  div
);
