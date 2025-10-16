/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useRef, useEffect } from 'react';
import { Widget } from '@lumino/widgets';

type LuminoProps = {
  id?: string;
  height?: string | number;
  children: Widget;
};

export const Lumino = ({
  id = 'lumino-id',
  height = '100%',
  children,
}: LuminoProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    console.log(
      'Lumino useEffect - ref.current:',
      ref.current,
      'children:',
      children,
      'children.isAttached:',
      children?.isAttached
    );
    if (ref && ref.current && children) {
      try {
        // Only attach if not already attached
        if (!children.isAttached) {
          console.log('Attaching widget to DOM');
          Widget.attach(children, ref.current);
          console.log('Widget attached successfully');
          console.log('Widget node:', children.node);
          console.log('Widget node parent:', children.node.parentElement);
          console.log(
            'Container children after attach:',
            ref.current.children.length
          );
          console.log('Widget is visible:', children.isVisible);
          if (!children.isVisible) {
            console.log('Making widget visible');
            children.show();
          }
          // Force the widget to update
          children.update();
        } else {
          console.log('Widget already attached');
          console.log('Widget node:', children.node);
          console.log('Widget node parent:', children.node.parentElement);
          // Ensure widget is in the DOM
          if (!ref.current.contains(children.node)) {
            console.log('Widget node not in container, re-attaching');
            Widget.attach(children, ref.current);
          }
        }
      } catch (e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      return () => {
        console.log('Lumino cleanup - detaching widget');
        try {
          if (children && (children.isAttached || children.node.isConnected)) {
            console.log('Detaching widget from DOM');
            Widget.detach(children);
          }
        } catch (e) {
          console.warn('Exception while detaching Lumino widget.', e);
        }
      };
    }
  }, [ref, children]);
  return (
    <div id={id} ref={ref} style={{ height: height, minHeight: height }} />
  );
};

export default Lumino;
