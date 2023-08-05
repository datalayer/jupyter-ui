import IPyWidgetsAttached from '../../jupyter/ipywidgets/IPyWidgetsAttached';

import './IPyWidgetsComponent.css';

export const IpyWidgetsComponent = (props: { Widget: any }) => {
  const { Widget } = props;
  return <>
    <IPyWidgetsAttached Widget={Widget}/>
  </>
}

export default IpyWidgetsComponent;
