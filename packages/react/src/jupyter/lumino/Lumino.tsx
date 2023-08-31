import { useRef, useEffect, PropsWithChildren } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Widget } from '@lumino/widgets';

type Props = any & {
  id: string;
}

export const Lumino = (props: PropsWithChildren<Props>) => {
  const ref = useRef<HTMLDivElement>(null);
  const { children, id } = props;
  useEffect(() => {
    const widget = children as Widget;
    try {
      Widget.attach(widget, ref.current!);
    } catch(e) {
      console.warn('Exception while attaching Lumino widget.', e);
    }
    return () => {
      try {
        unmountComponentAtNode(widget.node);
        if (widget.isAttached || widget.node.isConnected) {
          widget.dispose();
          Widget.detach(widget);
        }
      } catch(e) {
        // no-op
        // console.debug('Exception while detaching Lumino widget.', e);
      }
    }
  }, [children]);
  return <div ref={ref} id={id}/>
}

export default Lumino;
