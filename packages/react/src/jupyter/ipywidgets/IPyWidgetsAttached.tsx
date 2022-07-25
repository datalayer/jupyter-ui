/**
 * The IPyWidgetsAttached class allows to render a Lumino
 * Widget being mounted in the React.js tree.
 */
const IPyWidgetsAttached = (props: { Widget: any }) => {
  const { Widget } = props;
  return <div ref={ref => {
    if (ref) {
      new Widget(ref);
    }
  }}/>;
}

export default IPyWidgetsAttached;
