/*
 * Copyright (c) 2021-Present Datalayer, Inc.
 *
 * MIT License
 */

/**
 * An ipywidget variable, live.
 *
 * Drawn as a notebook draws one: jupyter-react's lab widget manager
 * (`KernelWidgetManager`) and its renderer (`WidgetLabRenderer`), on a
 * clone of the kernel's connection. The clone has its own comm targets, so
 * the manager does not take the widget comms of the notebook or cell that
 * shares the kernel; it asks the kernel for the widgets' state, as a second
 * JupyterLab view does, and stays in sync with it: moving the slider here
 * changes the value in the kernel.
 *
 * Loaded only when a widget is opened: the widgets' code is heavy.
 *
 * @module components/kernel/variables/WidgetVariableView
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Text } from '@primer/react';
import { Box } from '@datalayer/primer-addons';
import type { Kernel } from '@jupyterlab/services';
import {
  MimeModel,
  RenderMimeRegistry,
  standardRendererFactories,
} from '@jupyterlab/rendermime';
import { KernelWidgetManager } from '../../../jupyter/ipywidgets/lab/manager';
import { WidgetLabRenderer } from '../../../jupyter/ipywidgets/lab/renderer';
import { WIDGET_VIEW_MIMETYPE } from '../../../jupyter/ipywidgets/mimetypes';
import { Lumino } from '../../lumino/Lumino';

/** One widget manager per kernel connection, on its own clone. */
const managers = new WeakMap<Kernel.IKernelConnection, KernelWidgetManager>();

function managerOf(connection: Kernel.IKernelConnection): KernelWidgetManager {
  let manager = managers.get(connection);
  if (!manager || manager.isDisposed) {
    const clone = connection.clone({ handleComms: true });
    const rendermime = new RenderMimeRegistry({
      initialFactories: standardRendererFactories,
    });
    manager = new KernelWidgetManager(clone, rendermime);
    const created = manager;
    connection.disposed.connect(() => {
      created.dispose();
      clone.dispose();
    });
    managers.set(connection, manager);
  }
  return manager;
}

export type WidgetVariableViewProps = {
  connection: Kernel.IKernelConnection;
  modelId: string;
};

export function WidgetVariableView({
  connection,
  modelId,
}: WidgetVariableViewProps): ReactElement {
  const [renderer, setRenderer] = useState<WidgetLabRenderer>();
  useEffect(() => {
    const manager = managerOf(connection);
    const view = new WidgetLabRenderer(
      {
        mimeType: WIDGET_VIEW_MIMETYPE,
        sanitizer: { sanitize: (html: string) => html },
        resolver: null,
        linkHandler: null,
        latexTypesetter: null,
      } as any,
      manager
    );
    void view.renderModel(
      new MimeModel({
        data: {
          [WIDGET_VIEW_MIMETYPE]: {
            model_id: modelId,
            version_major: 2,
            version_minor: 0,
          },
        },
      })
    );
    setRenderer(view);
    return () => view.dispose();
  }, [connection, modelId]);
  return (
    <Box data-kernel-variable-widget={modelId} sx={{ minHeight: 32 }}>
      {renderer ? (
        <Lumino id={`kernel-variable-widget-${modelId}`} height="auto">
          {renderer}
        </Lumino>
      ) : (
        <Text sx={{ fontSize: 1, color: 'fg.muted' }}>Loading the widget…</Text>
      )}
    </Box>
  );
}

export default WidgetVariableView;
