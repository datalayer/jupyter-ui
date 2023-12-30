/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { DisposableDelegate } from '@lumino/disposable';
import { AttachedProperty } from '@lumino/properties';
import { filter } from '@lumino/algorithm';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { DocumentRegistry, Context } from '@jupyterlab/docregistry';
import {
  INotebookModel,
  INotebookTracker,
  Notebook,
  NotebookPanel,
  NotebookTracker,
} from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { CodeCell } from '@jupyterlab/cells';
import { Kernel } from '@jupyterlab/services';
import { WidgetRenderer } from './renderer';
import { NotebookWidgetManager, WIDGET_VIEW_MIMETYPE } from './manager';
import { OutputModel, OutputView, OUTPUT_WIDGET_VERSION } from './output';
import { KernelMessage } from '@jupyterlab/services';
import { requireLoader } from '@jupyter-widgets/html-manager';
import {
  BundledIPyWidgets,
  ExternalIPyWidgets,
} from '../../../components/notebook/Notebook';

// We import only the version from the specific module in controls so that the
// controls code can be split and dynamically loaded in webpack.
import { JUPYTER_CONTROLS_VERSION } from '@jupyter-widgets/controls/lib/version';

import * as base from '@jupyter-widgets/base';
import * as controls from '@jupyter-widgets/controls';

// Exposing @jupyter-widgets/base and @jupyter-widgets/controls as AMD modules for custom widget bundles that depend on it.

if (
  typeof window !== 'undefined' &&
  typeof (window as any).define !== 'undefined'
) {
  (window as any).define('@jupyter-widgets/base', base);
  (window as any).define('@jupyter-widgets/controls', controls);
}

/**
 * The widget registry.
 */
const WIDGET_REGISTRY: base.IWidgetRegistryData[] = [];

/**
 * The cached settings.
 */
const SETTINGS: NotebookWidgetManager.Settings = { saveState: false };

/**
 * Iterate through all widget renderers in a notebook.
 */
function* widgetRenderers(
  notebook: Notebook
): Generator<WidgetRenderer, void, unknown> {
  for (const cell of notebook.widgets) {
    if (cell.model.type === 'code') {
      for (const codecell of (cell as CodeCell).outputArea.widgets) {
        for (const output of Array.from(codecell.children())) {
          if (output instanceof WidgetRenderer) {
            yield output;
          }
        }
      }
    }
  }
}

/**
 * Iterate through all matching linked output views
 */
function* outputViews(path: string, app?: JupyterFrontEnd): Generator<WidgetRenderer, void, unknown> {
  if (app) {
    const linkedViews = filter(
      app.shell.widgets(),
      (w) => w.id.startsWith('LinkedOutputView-') && (w as any).path === path
    );
    for (const view of Array.from(linkedViews)) {
      for (const outputs of Array.from(view.children())) {
        for (const output of Array.from(outputs.children())) {
          if (output instanceof WidgetRenderer) {
            yield output;
          }
        }
      }
    }  
  }
}

function* chain<T>(
  ...args: IterableIterator<T>[]
): Generator<T, void, undefined> {
  for (const it of args) {
    yield* it;
  }
}

const bindUnhandledIOPubMessageSignal = (
  notebookPanel: NotebookPanel
): void => {
  const widgetManager = Private.widgetManagerProperty.get(
    notebookPanel.context
  );
  if (widgetManager) {
    widgetManager.onUnhandledIOPubMessage.connect(
      (sender: NotebookWidgetManager, msg: KernelMessage.IIOPubMessage) => {
        console.warn('Unhandled IOPub Message Signal', sender, msg);
      }
    );
  }
};

export function registerWidgetManager(
  context: DocumentRegistry.IContext<INotebookModel>,
  rendermime: IRenderMimeRegistry,
  kernelConnection: Kernel.IKernelConnection | null,
  renderers: IterableIterator<WidgetRenderer>,
  app?: JupyterFrontEnd,
): DisposableDelegate {
  let widgetManager = Private.widgetManagerProperty.get(context);
  if (!widgetManager) {
    widgetManager = new NotebookWidgetManager(context, rendermime, SETTINGS, kernelConnection);
    WIDGET_REGISTRY.forEach(data => widgetManager!.register(data));
    Private.widgetManagerProperty.set(context, widgetManager);
  }
  for (const renderer of renderers) {
    renderer.manager = widgetManager;
  }
  // Replace the placeholder widget renderer with one bound to this widget manager.
  rendermime.removeMimeType(WIDGET_VIEW_MIMETYPE);
  rendermime.addFactory(
    {
      safe: false,
      mimeTypes: [WIDGET_VIEW_MIMETYPE],
      createRenderer: options => new WidgetRenderer(options, widgetManager),
    },
    -10
  );
  const disposable = new DisposableDelegate(() => {
    if (rendermime) {
      rendermime.removeMimeType(WIDGET_VIEW_MIMETYPE);
    }
    if (widgetManager) {
      widgetManager.dispose();
    }
  });
  return disposable;
}

export const registerExternalIPyWidgets = (
  context: Context<INotebookModel>,
  notebookTracker: NotebookTracker,
  ipywidgets: ExternalIPyWidgets[],
  kernelConnection: Kernel.IKernelConnection | null,
  app?: JupyterFrontEnd
) => {
  const loadIPyWidget = (name: string, version: string) => {
    requireLoader(name, version).then(module => {
      const exports = { ...module };
      const widgetRegistryData = {
        name,
        version,
        exports,
      };
      WIDGET_REGISTRY.push(widgetRegistryData);
      notebookTracker.forEach(notebookPanel => {
        const widgetManager = Private.widgetManagerProperty.get(context);
        if (widgetManager) {
          widgetManager.register(widgetRegistryData);
          registerWidgetManager(
            notebookPanel.context,
            notebookPanel.content.rendermime,
            kernelConnection,
            chain(
              widgetRenderers(notebookPanel.content),
              outputViews(notebookPanel.context.path, app)
            )
          );
          bindUnhandledIOPubMessageSignal(notebookPanel);
        }
      });
    });
  };
  ipywidgets.forEach(ipywidget => {
    loadIPyWidget(ipywidget.name, ipywidget.version);
  });
};

export const registerBundledIPyWidgets = (
  context: Context<INotebookModel>,
  notebookTracker: NotebookTracker,
  ipywidgets: BundledIPyWidgets[],
  kernelConnection: Kernel.IKernelConnection | null,
  app?: JupyterFrontEnd
) => {
  const loadIPyWidget = (name: string, version: string, module: any) => {
    const exports = { ...module };
    const widgetRegistryData = {
      name,
      version,
      exports,
    };
    WIDGET_REGISTRY.push(widgetRegistryData);
    notebookTracker.forEach(notebookPanel => {
      const widgetManager = Private.widgetManagerProperty.get(context);
      if (widgetManager) {
        widgetManager.register(widgetRegistryData);
        registerWidgetManager(
          notebookPanel.context,
          notebookPanel.content.rendermime,
          kernelConnection,
          chain(
            widgetRenderers(notebookPanel.content),
            outputViews(notebookPanel.context.path, app)
          )
        );
        bindUnhandledIOPubMessageSignal(notebookPanel);
      }
    });
  };
  ipywidgets.forEach(ipywidget => {
    loadIPyWidget(ipywidget.name, ipywidget.version, ipywidget.module);
  });
};

/**
 * The widget manager provider.
 */
export const iPyWidgetsPlugin = {
  activate: activateIPyWidgetExtension,
};

/**
 * Activate the widget extension.
 */
function activateIPyWidgetExtension(
  rendermime: IRenderMimeRegistry,
  tracker: INotebookTracker,
  kernelConnection: Kernel.IKernelConnection | null,
  app?: JupyterFrontEnd
): base.IJupyterWidgetRegistry {
  // Add a placeholder widget renderer.
  rendermime.addFactory(
    {
      safe: false,
      mimeTypes: [WIDGET_VIEW_MIMETYPE],
      createRenderer: options => new WidgetRenderer(options),
    },
    -10
  );
  tracker.forEach(notebookPanel => {
    registerWidgetManager(
      notebookPanel.context,
      notebookPanel.content.rendermime,
      kernelConnection,
      chain(
        widgetRenderers(notebookPanel.content),
        outputViews(notebookPanel.context.path, app)
      )
    );
    bindUnhandledIOPubMessageSignal(notebookPanel);
  });
  tracker.widgetAdded.connect((sender, notebookPanel) => {
    registerWidgetManager(
      notebookPanel.context,
      notebookPanel.content.rendermime,
      kernelConnection,
      chain(
        widgetRenderers(notebookPanel.content),
        outputViews(notebookPanel.context.path, app)
      )
    );
    bindUnhandledIOPubMessageSignal(notebookPanel);
  });
  const registerWidget = {
    registerWidget(data: base.IWidgetRegistryData): void {
      WIDGET_REGISTRY.push(data);
    },
  };
  return registerWidget;
}

/**
 * The base widgets.
 */
export const baseWidgetsPlugin = {
  activate: (registry: base.IJupyterWidgetRegistry): void => {
    registry.registerWidget({
      name: '@jupyter-widgets/base',
      version: base.JUPYTER_WIDGETS_VERSION,
      exports: {
        DOMWidgetModel: base.DOMWidgetModel,
        DOMWidgetView: base.DOMWidgetView,
        ErrorWidgetView: base.ErrorWidgetView,
        LayoutModel: base.LayoutModel,
        LayoutView: base.LayoutView,
        StyleModel: base.StyleModel,
        StyleView: base.StyleView,
        WidgetModel: base.WidgetModel,
        WidgetView: base.WidgetView,
      },
    });
  },
};

/**
 * The control widgets.
 */
export const controlWidgetsPlugin = {
  activate: (registry: base.IJupyterWidgetRegistry): void => {
    registry.registerWidget({
      name: '@jupyter-widgets/controls',
      version: JUPYTER_CONTROLS_VERSION,
      exports: () => {
        return new Promise((resolve, reject) => {
          (require as any).ensure(
            ['@jupyter-widgets/controls'],
            (require: NodeRequire) => {
              // eslint-disable-next-line @typescript-eslint/no-var-requires
              resolve(require('@jupyter-widgets/controls'));
            },
            (err: any) => {
              reject(err);
            },
            '@jupyter-widgets/controls'
          );
        });
      },
    });
  },
};

/**
 * The output widget.
 */
export const outputWidgetPlugin = {
  activate: (registry: base.IJupyterWidgetRegistry): void => {
    registry.registerWidget({
      name: '@jupyter-widgets/output',
      version: OUTPUT_WIDGET_VERSION,
      exports: {
        OutputModel,
        OutputView
      },
    });
  },
};

namespace Private {
  /**
   * A private attached property for a widget manager.
   */
  export const widgetManagerProperty = new AttachedProperty<
    DocumentRegistry.Context,
    NotebookWidgetManager | undefined
  >({
    name: 'widgetManager',
    create: (owner: DocumentRegistry.Context): undefined => undefined,
  });
}

export default [
  iPyWidgetsPlugin,
  baseWidgetsPlugin,
  controlWidgetsPlugin,
  outputWidgetPlugin,
];
