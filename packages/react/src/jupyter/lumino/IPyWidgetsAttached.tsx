import IPyWidgetsViewManager from '../ipywidgets/IPyWidgetsViewManager';

type Props = {
  view: any,
  state: any,
}

/**
 * IPyWidgetAttached allows to render a Lumino
 * Widget being mounted in the React.js tree.
 */
const IPyWidgetsAttached = (props: Props) => {
  const { view, state } = props;
  return (
    <div ref={ref => {
      if (ref) {
        var manager = new IPyWidgetsViewManager(ref);
        manager
          .set_state(state)
          .then((models: any) =>
            manager.create_view(
              models.find(
                (element: any) => element.model_id === view.model_id
              )
            )
          )
          .then((view: any) => manager.display_view(view));    
      }
    }}/>
  );
}

export default IPyWidgetsAttached;
