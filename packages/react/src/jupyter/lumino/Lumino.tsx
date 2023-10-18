import { useRef, useEffect } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Widget } from '@lumino/widgets';

type LuminoProps = {
  id?: string;
  children: Widget;
}

export const Lumino = (props: LuminoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { children, id } = props;
  useEffect(() => {
    if (ref && ref.current) {
      try {
        Widget.attach(children, ref.current);
      } catch(e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      return () => {
        try {
          unmountComponentAtNode(children.node);
          if (children.isAttached || children.node.isConnected) {
            children.dispose();
            Widget.detach(children);
          }
        } catch(e) {
          // no-op
          // console.debug('Exception while detaching Lumino widget.', e);
        }
      }  
    }
  }, [ref, children]);
  return <div ref={ref} id={id}/>
}

Lumino.defaultProps = {
  id: "lumino-id",
}

export default Lumino;
