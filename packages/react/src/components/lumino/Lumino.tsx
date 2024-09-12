/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useRef, useEffect } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Widget } from '@lumino/widgets';

type LuminoProps = {
  id?: string;
  height?: string | number;
  children: Widget;
};

export const Lumino = (props: LuminoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { children, id, height } = props;
  useEffect(() => {
    if (ref && ref.current) {
      try {
        Widget.attach(children, ref.current);
      } catch (e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      return () => {
        try {
          unmountComponentAtNode(children.node);
          /*
          if (children.isAttached || children.node.isConnected) {
            children.dispose();
            Widget.detach(children);
          }
          */
        } catch (e) {
          // no-op.
          // console.debug('Exception while detaching Lumino widget.', e);
        }
      };
    }
  }, [ref, children]);
  return (
    <div
      id={id}
      ref={ref}
      style={{ height: height, minHeight: height }}
    />
  );
}

Lumino.defaultProps = {
  id: 'lumino-id',
  height: '100%',
}

export default Lumino;
