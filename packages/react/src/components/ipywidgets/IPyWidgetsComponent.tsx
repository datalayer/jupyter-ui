import IPyWidgetsAttached from '../../jupyter/ipywidgets/IPyWidgetsAttached';

import './IPyWidgetsComponent.css';

export const IPyWidgetsComponent = (props: { Widget: any }) => {
  const { Widget } = props;
  return <>
    <IPyWidgetsAttached Widget={Widget}/>
  </>
}

export default IPyWidgetsComponent;
