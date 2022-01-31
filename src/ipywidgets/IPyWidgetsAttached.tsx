/**
 * The IPyWidgetsAttached class allows to render a Lumino
 * Widget being mounted in the React.js tree.
 */
const IPyWidgetsAttached = (props: { widget: any }) => {
  const { widget } = props;
  return <div ref={ref => {
    if (ref) {
      new widget(ref);
    }
  }}/>;
}

export default IPyWidgetsAttached;
