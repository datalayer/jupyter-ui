import { Jupyter } from '../../../jupyter/Jupyter';
import OutputIPyWidgets from '../../../components/output/OutputIPyWidgets';

import { view, state } from './../../../examples/notebooks/OutputIPyWidgetsExample';

const IPyWidgetsComponent = () => {
  return (
    <>
      <Jupyter>
        <OutputIPyWidgets view={view} state={state}/>
      </Jupyter>
    </>
  )
}

export default IPyWidgetsComponent;
