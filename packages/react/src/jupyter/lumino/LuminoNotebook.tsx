import { useRef, useEffect } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Widget } from '@lumino/widgets';
import NotebookAdapter from "../../components/notebook/NotebookAdapter";

export const LuminoNotebook = (props: { adapter: NotebookAdapter }) => {
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
        unmountComponentAtNode(panel.node);
        if (panel.isAttached || panel.node.isConnected) {
          adapter.dispose();
          Widget.detach(panel);
        }
      }
      catch(e) {
        console.debug('Exception while detaching Lumino widget.', e);
      }
    }
  }, [adapter.uid]);
  return <div ref={ref}/>
}

export default LuminoNotebook;
