/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

import { useEffect, useRef } from 'react';

import IPyWidgetsViewManager from './IPyWidgetsViewManager';

type Props = {
  view: any;
  state: any;
};

/**
 * IPyWidgetAttached allows to render a Lumino
 * Widget being mounted in the React.js tree.
 *
 * Mounted once per widget, however often the tree around it re-renders.
 *
 * This used to do its work in an inline `ref` callback, which React re-invokes
 * on every render because the function identity changes each time — and each
 * invocation built a fresh manager and *appended* another view to the same
 * container. A parent that re-rendered five times therefore showed five copies
 * of one slider, stacked, all live. It only became visible when outputs began
 * arriving as a stream, because until then nothing re-rendered.
 *
 * So: an effect keyed on the widget, a container that is emptied before
 * anything is put in it, and a guard that does nothing at all when asked to
 * show the widget it is already showing.
 */
const IPyWidgetsAttached = (props: Props) => {
  const { view, state } = props;
  const host = useRef<HTMLDivElement | null>(null);
  const showing = useRef<string | null>(null);

  useEffect(() => {
    const node = host.current;
    const modelId = view?.model_id;
    if (!node || !modelId) {
      return;
    }
    const signature = String(modelId);
    // Already on screen. Rebuilding it would discard whatever state the
    // reader has put into the control — a slider they moved, a box they
    // ticked — every time an unrelated part of the page changed.
    if (showing.current === signature) {
      return;
    }
    showing.current = signature;
    // Never append to what is there: emptying first is what makes this safe
    // to run more than once.
    node.replaceChildren();

    let cancelled = false;
    const manager = new IPyWidgetsViewManager(node);
    manager
      .set_state(state)
      .then((models: any) =>
        manager.create_view(
          models.find((element: any) => element.model_id === modelId)
        )
      )
      .then((created: any) => {
        if (!cancelled) {
          manager.display_view(created);
        }
      })
      .catch((error: unknown) => {
        // A widget that cannot be built is worth saying so about: silence
        // here reads as a widget that renders as nothing.
        console.error('[jupyter-react] could not render the widget', error);
      });

    return () => {
      cancelled = true;
    };
  }, [view, state]);

  return <div ref={host} />;
};

export default IPyWidgetsAttached;
