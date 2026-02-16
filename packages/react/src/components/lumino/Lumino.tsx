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
  // Track whether the React component is still mounted so the deferred
  // cleanup microtask can skip work when the DOM container is already gone.
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
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
        // Defer Lumino widget detachment to avoid synchronous React root
        // unmount during React's own render/commit cycle.  Lumino's
        // Widget.detach → onBeforeDetach → ReactWidget._rootDOM.unmount()
        // triggers "Attempted to synchronously unmount a root while React
        // was already rendering" when called from a passive effect cleanup.
        // Using queueMicrotask lets the current React commit finish first.
        const widget = children;
        queueMicrotask(() => {
          try {
            // Skip detach if the component unmounted — the widget will be
            // cleaned up by NotebookBase's panel.dispose() instead.
            // Attempting to detach here after the DOM container is removed
            // would cause "Widget is not attached".
            if (!mountedRef.current) {
              return;
            }
            if (widget && !widget.isDisposed && widget.isAttached) {
              Widget.detach(widget);
            }
          } catch (e) {
            console.warn('Exception while detaching Lumino widget.', e);
          }
        });
      };
    }
  }, [ref, children]);
  return (
    <div id={id} ref={ref} style={{ height: height, minHeight: height }} />
  );
};

export default Lumino;
