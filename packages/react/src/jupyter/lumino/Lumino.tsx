import { useRef, useEffect, PropsWithChildren } from 'react';
import ReactDOM from 'react-dom';
import { Widget } from '@lumino/widgets';

export const Lumino = (props: PropsWithChildren<any>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { children } = props;
  useEffect(() => {
    const widget = children as Widget;
    try {
      Widget.attach(widget, ref.current!);
    } catch(e) {
      console.warn('Exception while attaching Lumino widget.', e);
    }
    return () => {
      try {
        ReactDOM.unmountComponentAtNode(widget.node);
        widget.dispose();
        if (widget.isAttached || widget.node.isConnected) {
          Widget.detach(widget);
        }
      } catch(e) {
        console.warn('Exception while detaching Lumino widget.', e);
      }
    }
  }, [children]);
  return <div ref={ref}/>
}

export default Lumino;
