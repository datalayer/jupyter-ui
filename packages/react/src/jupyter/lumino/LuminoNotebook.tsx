import { useRef, useEffect } from 'react';
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
      if (panel.isAttached) {
        try {
          Widget.detach(panel);
        } catch(e) {
          console.warn('Exception while detaching Lumino widget.', e);
        }
      }
      adapter.dispose();
    }
  }, [adapter.uid]);
  return <div ref={ref}/>
}

export default LuminoNotebook;
