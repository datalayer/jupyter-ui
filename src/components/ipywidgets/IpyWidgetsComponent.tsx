import IPyWidgetsAttached from '../../ipywidgets/IPyWidgetsAttached';

import './IpyWidgetsComponent.css';

const IpyWidgetsComponent = (props: { widget: any }) => {
  const { widget } = props;
  return <>
    <IPyWidgetsAttached widget={widget}/>
  </>
}

export default IpyWidgetsComponent;
