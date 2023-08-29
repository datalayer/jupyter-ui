import { Jupyter } from '../../../jupyter/Jupyter';
import OutputIPyWidgets from '../../../components/output/OutputIPyWidgets';


import { view, state } from './../../../examples/samples/OutputIPyWidgetsExample';

const IPyWidgetsComponent = () => {
  return (
    <>
      <Jupyter startDefaultKernel={false}>
        <OutputIPyWidgets view={view} state={state}/>
      </Jupyter>
    </>
  )
}

export default IPyWidgetsComponent;
