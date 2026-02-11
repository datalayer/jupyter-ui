/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { useRef, useEffect } from 'react';
import { MessageLoop } from '@lumino/messaging';
import { Widget, BoxPanel } from '@lumino/widgets';
import { Box } from '@primer/react';

export type LuminoBoxProps = {
  id?: string;
  height?: number | string;
  children: Widget;
};

export const LuminoBox = ({
  id = 'lumino-box-id',
  height = '100%',
  children,
}: LuminoBoxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref && ref.current) {
      const boxPanel = new BoxPanel();
      boxPanel.spacing = 0;
      boxPanel.addWidget(children);
      try {
        Widget.attach(boxPanel, ref.current);
      } catch (e) {
        console.warn('Exception while attaching Lumino widget.', e);
      }
      // Observe the container for size changes and notify the Lumino widget.
      const observer = new ResizeObserver(() => {
        if (boxPanel.isAttached) {
          MessageLoop.sendMessage(boxPanel, Widget.ResizeMessage.UnknownSize);
        }
      });
      observer.observe(ref.current);
      return () => {
        observer.disconnect();
        try {
          if (boxPanel.isAttached || boxPanel.node.isConnected) {
            boxPanel.dispose();
            Widget.detach(boxPanel);
          }
        } catch (e) {
          // no-op.
          //          console.debug('Exception while detaching Lumino widget.', e);
        }
      };
    }
  }, [ref, children]);
  return (
    <Box
      style={{
        height,
        minHeight: height,
        width: '100%',
      }}
    >
      <div id={id} ref={ref} />
    </Box>
  );
};

export default LuminoBox;
