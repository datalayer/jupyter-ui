import { useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Widget } from '@lumino/widgets';
import NotebookAdapter from "../../components/notebook/NotebookAdapter";

export const LuminoNotebook = (props: {adapter: NotebookAdapter }) => {
  const { adapter } = props;
  const panel = adapter.panel;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!panel) {
      return;
    }
    Widget.attach(panel, ref.current!);
    return () => {
      try {
        ReactDOM.unmountComponentAtNode(panel.node);
        if (panel.isAttached) {
          Widget.detach(panel);
        }
        adapter.dispose();
      }
      catch(e) {
          console.warn('Exception while detaching Lumino widget.', e);
      }
    }
  }, [adapter.uid]);
  return <div ref={ref}/>
}

export default LuminoNotebook;
