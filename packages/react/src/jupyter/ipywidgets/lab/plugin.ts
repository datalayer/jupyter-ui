import { DisposableDelegate } from '@lumino/disposable';
import { AttachedProperty } from '@lumino/properties';
// import { filter } from '@lumino/algorithm';
import { DocumentRegistry, Context } from '@jupyterlab/docregistry';
import { INotebookModel, INotebookTracker, Notebook, NotebookPanel, NotebookTracker } from '@jupyterlab/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { CodeCell } from '@jupyterlab/cells';
import { WidgetRenderer } from './renderer';
import { WidgetManager, WIDGET_VIEW_MIMETYPE } from './manager';
import { OutputModel, OutputView, OUTPUT_WIDGET_VERSION } from './output';
import { KernelMessage } from '@jupyterlab/services';
import { requireLoader } from "@jupyter-widgets/html-manager";
import * as base from '@jupyter-widgets/base';
import { BundledIPyWidgets, ExternalIPyWidgets } from '../../../components/notebook/Notebook';

// We import only the version from the specific module in controls so that the
// controls code can be split and dynamically loaded in webpack.
import { JUPYTER_CONTROLS_VERSION } from '@jupyter-widgets/controls/lib/version';

import '@jupyter-widgets/base/css/index.css';
import '@jupyter-widgets/controls/css/widgets-base.css';

const WIDGET_REGISTRY: base.IWidgetRegistryData[] = [];

/**
 * The cached settings.
 */
const SETTINGS: WidgetManager.Settings = { saveState: false };

/**
 * Iterate through all widget renderers in a notebook.
 */
function* widgetRenderers(notebook: Notebook): Generator<WidgetRenderer, void, unknown> {
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
function* outputViews(app: JupyterFrontEnd, path: string): Generator<WidgetRenderer, void, unknown> {
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
*/
function* chain<T>(
  ...args: IterableIterator<T>[]
): Generator<T, void, undefined> {
  for (const it of args) {
    yield* it;
  }
}

const bindUnhandledIOPubMessageSignal = (notebookPanel: NotebookPanel): void => {
  const widgetManager = Private.widgetManagerProperty.get(notebookPanel.context);
  if (widgetManager) {
    widgetManager.onUnhandledIOPubMessage.connect(
      (sender: WidgetManager, msg: KernelMessage.IIOPubMessage) => {
        console.log('unhandledIOPubMessageSignal', sender, msg);
      }
    );
  }
};

export function registerWidgetManager(
  context: DocumentRegistry.IContext<INotebookModel>,
  rendermime: IRenderMimeRegistry,
  renderers: IterableIterator<WidgetRenderer>
): DisposableDelegate {
  let widgetManager = Private.widgetManagerProperty.get(context);
  if (!widgetManager) {
    widgetManager = new WidgetManager(context, rendermime, SETTINGS);
    WIDGET_REGISTRY.forEach((data) => widgetManager!.register(data));
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
      createRenderer: (options) => new WidgetRenderer(options, widgetManager),
    },
    -10
  );
  return new DisposableDelegate(() => {
    if (rendermime) {
      rendermime.removeMimeType(WIDGET_VIEW_MIMETYPE);
    }
    if (widgetManager) {
      widgetManager.dispose();
    }
  });
}

export const externalIPyWidgetsPlugin = (context: Context<INotebookModel>, notebookTracker: NotebookTracker, ipywidgets: ExternalIPyWidgets[]) => {
  const loadIPyWidget = (name: string, version: string ) => {
    requireLoader(name, version).then((module) => {
      const exports = { ...module };
      const data = {
        name,
        version,
        exports,
      };
      WIDGET_REGISTRY.push(data);
      notebookTracker.forEach((notebookPanel) => {
        const widgetManager = Private.widgetManagerProperty.get(context);
        if (widgetManager) {
          widgetManager.register(data);
          registerWidgetManager(
            notebookPanel.context,
            notebookPanel.content.rendermime,
            chain(
              widgetRenderers(notebookPanel.content),
      //          outputViews(app, panel.context.path)
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
}

export const bundledIPyWidgetsPlugin = (context: Context<INotebookModel>, notebookTracker: NotebookTracker, ipywidgets: BundledIPyWidgets[]) => {
  const loadIPyWidget = (name: string, version: string, module: any) => {
    const exports = { ...module };
    const data = {
      name,
      version,
      exports,
    };
    WIDGET_REGISTRY.push(data);
    notebookTracker.forEach((notebookPanel) => {
      const widgetManager = Private.widgetManagerProperty.get(context);
      if (widgetManager) {
        widgetManager.register(data);
        registerWidgetManager(
          notebookPanel.context,
          notebookPanel.content.rendermime,
          chain(
            widgetRenderers(notebookPanel.content),
    //          outputViews(app, panel.context.path)
          )
        );
        bindUnhandledIOPubMessageSignal(notebookPanel);  
      }
    });
  };
  ipywidgets.forEach(ipywidget => {
    loadIPyWidget(ipywidget.name, ipywidget.version, ipywidget.module);
  });
}

/**
 * The widget manager provider.
 */
export const managerPlugin = {
  activate: activateWidgetExtension,
};

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  rendermime: IRenderMimeRegistry,
  tracker: INotebookTracker,
): base.IJupyterWidgetRegistry {
  // Add a placeholder widget renderer.
  rendermime.addFactory(
    {
      safe: false,
      mimeTypes: [WIDGET_VIEW_MIMETYPE],
      createRenderer: (options) => new WidgetRenderer(options),
    },
    -10
  );
  tracker.forEach((notebookPanel) => {
    registerWidgetManager(
      notebookPanel.context,
      notebookPanel.content.rendermime,
      chain(
        widgetRenderers(notebookPanel.content),
//          outputViews(app, panel.context.path)
      )
    );
    bindUnhandledIOPubMessageSignal(notebookPanel);
  });
  tracker.widgetAdded.connect((sender, notebookPanel) => {
    registerWidgetManager(
      notebookPanel.context,
      notebookPanel.content.rendermime,
      chain(
        widgetRenderers(notebookPanel.content),
//          outputViews(app, panel.context.path)
      )
    );
    bindUnhandledIOPubMessageSignal(notebookPanel);
  });
  return {
    registerWidget(data: base.IWidgetRegistryData): void {
      WIDGET_REGISTRY.push(data);
    },
  };
}

/**
 * The base widgets.
 */
export const baseWidgetsPlugin = {
  activate: (
    registry: base.IJupyterWidgetRegistry
  ): void => {
    registry.registerWidget({
      name: '@jupyter-widgets/base',
      version: base.JUPYTER_WIDGETS_VERSION,
      exports: {
        WidgetModel: base.WidgetModel,
        WidgetView: base.WidgetView,
        DOMWidgetView: base.DOMWidgetView,
        DOMWidgetModel: base.DOMWidgetModel,
        LayoutModel: base.LayoutModel,
        LayoutView: base.LayoutView,
        StyleModel: base.StyleModel,
        StyleView: base.StyleView,
        ErrorWidgetView: base.ErrorWidgetView,
      },
    });
  },
};

/**
 * The control widgets.
 */
export const controlWidgetsPlugin = {
  activate: (
    registry: base.IJupyterWidgetRegistry
  ): void => {
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
  activate: (
    registry: base.IJupyterWidgetRegistry
  ): void => {
    registry.registerWidget({
      name: '@jupyter-widgets/output',
      version: OUTPUT_WIDGET_VERSION,
      exports: { OutputModel, OutputView },
    });
  },
};

export default [
  managerPlugin,
  baseWidgetsPlugin,
  controlWidgetsPlugin,
  outputWidgetPlugin,
];
namespace Private {
  /**
   * A private attached property for a widget manager.
   */
  export const widgetManagerProperty = new AttachedProperty<
    DocumentRegistry.Context,
    WidgetManager | undefined
  >({
    name: 'widgetManager',
    create: (owner: DocumentRegistry.Context): undefined => undefined,
  });
}
