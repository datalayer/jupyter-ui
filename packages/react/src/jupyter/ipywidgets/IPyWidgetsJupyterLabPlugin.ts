import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel, INotebookTracker, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { IMainMenu } from '@jupyterlab/mainmenu';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { ILoggerRegistry, LogLevel } from '@jupyterlab/logconsole';
import { CodeCell } from '@jupyterlab/cells';
import { toArray } from '@lumino/algorithm';
import { DisposableDelegate } from '@lumino/disposable';
import { AttachedProperty } from '@lumino/properties';
import { WidgetRenderer, WidgetManager } from '@jupyter-widgets/jupyterlab-manager';
import { WIDGET_VIEW_MIMETYPE } from '@jupyter-widgets/jupyterlab-manager/lib/manager';
import { OutputModel, OutputView, OUTPUT_WIDGET_VERSION } from '@jupyter-widgets/jupyterlab-manager/lib/output';
import * as nbformat from '@jupyterlab/nbformat';
import * as base from '@jupyter-widgets/base';
// !!! We import only the version from the specific module in controls so that the controls code can be split and dynamically loaded in webpack.
import { JUPYTER_CONTROLS_VERSION } from '@jupyter-widgets/controls/lib/version';
import { KernelMessage } from '@jupyterlab/services';

const WIDGET_REGISTRY: base.IWidgetRegistryData[] = [];

/**
 * The cached settings.
 */
const SETTINGS: WidgetManager.Settings = { saveState: false };

/**
 * Iterate through all widget renderers in a notebook.
 */
function* widgetRenderers(
  notebook: Notebook
): Generator<WidgetRenderer, void, unknown> {
  for (const cell of notebook.widgets) {
    if (cell.model.type === 'code') {
      for (const codecell of (cell as CodeCell).outputArea.widgets) {
        for (const output of toArray(codecell.children())) {
          if (output instanceof WidgetRenderer) {
            console.log('IPyWidgetsJupyterLabPlugin widgetRenderers output', output);
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
/*
function* outputViews(
  app: JupyterFrontEnd,
  path: string
): Generator<WidgetRenderer, void, unknown> {
  const linkedViews = filter(
    app.shell.widgets(),
    (w) => w.id.startsWith('LinkedOutputView-') && (w as any).path === path
  );
  for (const view of toArray(linkedViews)) {
    for (const outputs of toArray(view.children())) {
      for (const output of toArray(outputs.children())) {
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

  for (const r of renderers) {
    r.manager = widgetManager;
  }

  // Replace the placeholder widget renderer with one bound to this widget manager.
  rendermime.removeMimeType(WIDGET_VIEW_MIMETYPE);
  rendermime.addFactory(
    {
      safe: false,
      mimeTypes: [WIDGET_VIEW_MIMETYPE],
      createRenderer: (options) => new WidgetRenderer(options, widgetManager),
    },
    0
  );

  return new DisposableDelegate(() => {
    if (rendermime) {
      rendermime.removeMimeType(WIDGET_VIEW_MIMETYPE);
    }
    widgetManager!.dispose();
  });

}

/**
 * Activate the widget extension.
 */
export function activateWidgetExtension(
  rendermime: IRenderMimeRegistry,
  tracker: INotebookTracker | null,
  menu: IMainMenu | null,
  loggerRegistry: ILoggerRegistry | null
): base.IJupyterWidgetRegistry {

  const bindUnhandledIOPubMessageSignal = (notebookPanel: NotebookPanel): void => {
    if (!loggerRegistry) {
      return;
    }
    const widgetManager = Private.widgetManagerProperty.get(notebookPanel.context);
    if (widgetManager) {
      widgetManager.onUnhandledIOPubMessage.connect(
        (sender: WidgetManager, msg: KernelMessage.IIOPubMessage) => {
          const logger = loggerRegistry.getLogger(notebookPanel.context.path);
          let level: LogLevel = 'warning';
          if (
            KernelMessage.isErrorMsg(msg) ||
            (KernelMessage.isStreamMsg(msg) && msg.content.name === 'stderr')
          ) {
            level = 'error';
          }
          const data: nbformat.IOutput = {
            ...msg.content,
            output_type: msg.header.msg_type,
          };
          logger.rendermime = notebookPanel.content.rendermime;
          logger.log({ type: 'output', data, level });
        }
      );
    }
  };

  // Add a placeholder widget renderer.
  rendermime.addFactory(
    {
      safe: false,
      mimeTypes: [WIDGET_VIEW_MIMETYPE],
      createRenderer: (options) => new WidgetRenderer(options),
    },
    -10
  );

  if (tracker !== null) {
    tracker.forEach((panel) => {
      registerWidgetManager(
        panel.context,
        panel.content.rendermime,
        chain(
          widgetRenderers(panel.content),
//          outputViews(app, panel.context.path)
        )
      );
      bindUnhandledIOPubMessageSignal(panel);
    });
    tracker.widgetAdded.connect((sender, panel) => {
      registerWidgetManager(
        panel.context,
        panel.content.rendermime,
        chain(
          widgetRenderers(panel.content),
//          outputViews(app, panel.context.path)
        )
      );
      bindUnhandledIOPubMessageSignal(panel);
    });
  }

  if (menu) {
    menu.settingsMenu.addGroup([
      { command: '@jupyter-widgets/jupyterlab-manager:saveWidgetState' },
    ]);
  }

  WIDGET_REGISTRY.push({
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
    },
  });

  WIDGET_REGISTRY.push({
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

  WIDGET_REGISTRY.push({
    name: '@jupyter-widgets/output',
    version: OUTPUT_WIDGET_VERSION,
    exports: { OutputModel, OutputView },
  });

  const widgetRegistry = {
    registerWidget(data: base.IWidgetRegistryData): void {
      WIDGET_REGISTRY.push(data);
    },
  };

  return widgetRegistry;

}

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
