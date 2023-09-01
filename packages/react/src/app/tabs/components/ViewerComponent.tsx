import Viewer from '../../../components/viewer/Viewer';

import nbformat from "../../..//examples/notebooks/IPyWidgetsExample1.ipynb.json";

const ViewerComponent = () => {
  return (
    <>
      <Viewer nbformat={nbformat} outputs={true}/>
    </>
  )
}

export default ViewerComponent;
