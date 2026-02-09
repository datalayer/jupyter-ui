/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useRef, useEffect } from 'react';
import { MessageLoop } from '@lumino/messaging';
import { Widget } from '@lumino/widgets';

export type LuminoProps = {
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
    if (ref && ref.current && children) {
      try {
        // Only attach if not already attached
        if (!children.isAttached) {
          Widget.attach(children, ref.current);
          if (!children.isVisible) {
            children.show();
          }
          // Force the widget to update
          children.update();
        } else {
          // Ensure widget is in the DOM
          if (!ref.current.contains(children.node)) {
            Widget.attach(children, ref.current);
          }
        }
      } catch (e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      // Observe the container for size changes and notify the Lumino widget.
      // Lumino widgets rely on explicit resize messages to re-layout; they do
      // not react to CSS / browser resize on their own.
      const observer = new ResizeObserver(() => {
        if (children.isAttached) {
          MessageLoop.sendMessage(children, Widget.ResizeMessage.UnknownSize);
        }
      });
      observer.observe(ref.current);
      return () => {
        observer.disconnect();
        try {
          if (children && (children.isAttached || children.node.isConnected)) {
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
