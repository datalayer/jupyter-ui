import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { Widget, BoxPanel } from '@lumino/widgets';

import { IChangedArgs } from '@jupyterlab/coreutils';
import { PageConfig } from '@jupyterlab/coreutils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { Kernel } from '@jupyterlab/services';
import { ServerConnection, ServiceManager } from '@jupyterlab/services';
import { DocumentManager } from '@jupyterlab/docmanager';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { standardRendererFactories as initialFactories, RenderMimeRegistry } from '@jupyterlab/rendermime';
// import { IDocumentProvider, IDocumentProviderFactory, ProviderMock } from '@jupyterlab/docprovider';
import { NotebookModelFactory, NotebookPanel, NotebookWidgetFactory, NotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { CodeMirrorEditorFactory, CodeMirrorMimeTypeService } from '@jupyterlab/codemirror';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { Completer, CompleterModel, CompletionHandler, ConnectorProxy, KernelCompleterProvider } from '@jupyterlab/completer';
import { MathJaxTypesetter } from '@jupyterlab/mathjax2';

import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";

import { INotebookProps } from './Notebook';
import { SetupCommands } from './NotebookCommands';
import ContentFactoryWithSidebar from './extension/ContentFactoryWithSidebar';

import { IPyWidgetsClassicManager } from "../../ipywidgets/IPyWidgetsClassicManager";
import { activateWidgetExtension } from "../../ipywidgets/IPyWidgetsJupyterLabPlugin";
import { activatePlotlyWidgetExtension } from "../../ipywidgets/plotly/jupyterlab-plugin";

import '@jupyterlab/notebook/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './NotebookAdapter.css';

class NotebookAdapter {
  private _props: INotebookProps;
  private _panel: BoxPanel;
  private _notebookPanel: NotebookPanel;
  private _serverSettings: ServerConnection.ISettings;
  private _serviceManager: ServiceManager;
  private _commands: CommandRegistry;
  private _iPyWidgetsClassicManager: IPyWidgetsClassicManager;
  private _injectableStore: any;

  constructor(props: INotebookProps, injectableStore: any) {
    this._props = props;
    this._panel = new BoxPanel();
    this._panel.id = 'dla-JupyterLab-Notebook';
    this._panel.spacing = 0;
    this.createApp = this.createApp.bind(this);
    this._serverSettings = ServerConnection.makeSettings({
      appendToken: true,
      init: {
        credentials: "include",
        mode: 'cors',
      }
    });
    this._serviceManager = new ServiceManager({
      serverSettings: this._serverSettings,
    });
    this._injectableStore = injectableStore;
  }

  createApp(notebookPath: string): void {

    // Initialize the command registry with the bindings.
    this._commands = new CommandRegistry();
    const useCapture = true;
  
    // Setup the keydown listener for the document.
    document.addEventListener(
      'keydown',
      event => {
        this._commands.processKeydownEvent(event);
      },
      useCapture
    );
  
    const rendermime = new RenderMimeRegistry({
      initialFactories: initialFactories,
      latexTypesetter: new MathJaxTypesetter({
        url: PageConfig.getOption('mathjaxUrl'),
        config: PageConfig.getOption('mathjaxConfig')
      })
    });

    const opener = {
      open: (widget: Widget) => {
        // Do nothing for sibling widgets for now.
      }
    };
    /*
    const url = URLExt.join(this._serverSettings.wsUrl, 'api/yjs');
    const collaborative = PageConfig.getOption('collaborative') == 'true' ? true : false;
    const docProviderFactory = (
      options: IDocumentProviderFactory.IOptions
    ): IDocumentProvider => {
      return collaborative
        ? new WebSocketProviderWithLocks({
            ...options,
            url,
            user: {

              
            }
          })
     return new ProviderMock();
    };
    */
    const docRegistry = new DocumentRegistry({});

    const docManager = new DocumentManager({
      registry: docRegistry,
      manager: this._serviceManager,
      opener,
//      collaborative,
//      docProviderFactory,
    });

    const editorServices: IEditorServices = {
      factoryService: new CodeMirrorEditorFactory(),
      mimeTypeService: new CodeMirrorMimeTypeService()
    };

    const notebookModelFactory = new NotebookModelFactory({});

    const editorFactory = editorServices.factoryService.newInlineEditor;
    const contentFactory = this._props.sidebarComponent ? 
      new ContentFactoryWithSidebar(
        this._props.sidebarComponent,
        this._commands,
        this._injectableStore,
        { editorFactory }
      ) :
      new NotebookPanel.ContentFactory({ editorFactory });

    const tracker = new NotebookTracker({ namespace: 'notebook' });

    if (this._props.ipywidgets === 'classic') {
      this._iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
      rendermime.addFactory(
        {
          safe: false,
          mimeTypes: [WIDGET_MIMETYPE],
          createRenderer: (options) => new WidgetRenderer(options, this._iPyWidgetsClassicManager),
        },
        1
      );
    }
    else if (this._props.ipywidgets === 'lab') {
      const widgetRegistry = activateWidgetExtension(rendermime, tracker, null, null);
      activatePlotlyWidgetExtension(widgetRegistry);
    }

    const notebookWidgetFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      canStartKernel: true,
      rendermime: rendermime,
      contentFactory: contentFactory,
      mimeTypeService: editorServices.mimeTypeService
    });

    notebookWidgetFactory.widgetCreated.connect((sender, widget) => {
      // Notify the widget tracker if restore data needs to update.
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      // Add the notebook panel to the tracker.
      void tracker.add(widget);
    });

    docRegistry.addModelFactory(notebookModelFactory);
    docRegistry.addWidgetFactory(notebookWidgetFactory);

    this._notebookPanel = docManager.open(notebookPath) as NotebookPanel;

    const editor =
      this._notebookPanel.content.activeCell && this._notebookPanel.content.activeCell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const sessionContext = this._notebookPanel.context.sessionContext;
    const provider = new KernelCompleterProvider();
    const timeout = 1000;
    const connector = new ConnectorProxy(
      { widget: this._notebookPanel, editor, session: sessionContext.session },
      [provider],
      timeout
    );
    const handler = new CompletionHandler({ completer, connector });
    void sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      const connector = new ConnectorProxy(
        { widget: this._notebookPanel, editor, session: sessionContext.session },
        [provider],
        timeout
      );
      handler.connector = connector;
    });
  
    // Set the handler's editor.
    handler.editor = editor;
  
    // Listen for active cell changes.
    this._notebookPanel.content.activeCellChanged.connect((sender: any, cell: Cell<ICellModel>) => {
      handler.editor = cell && cell.editor;
    });

    if (this._props.ipywidgets === 'classic') {
      this._notebookPanel.sessionContext.kernelChanged.connect((sender: any, args: IChangedArgs<Kernel.IKernelConnection | null, Kernel.IKernelConnection | null, 'kernel'>) => {
        this._iPyWidgetsClassicManager.registerWithKernel(args.newValue);
      });
    }

    // Hide the widget when it first loads.
    completer.hide();

    BoxPanel.setStretch(this._notebookPanel, 0);
    this._panel.addWidget(this._notebookPanel);

    // Handle resize events.
    window.addEventListener('resize', () => {
      this._notebookPanel.update();
    });

    SetupCommands(this._commands, this._notebookPanel, handler);

    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = tracker.currentWidget;
      return widget;
    }
    function isEnabled(): boolean {
      return (
        tracker.currentWidget !== null
      );
    }
    this._commands.addCommand('run-selected-codecell', {
      label: 'Run Cell',
      execute: args => {
        const current = getCurrent(args);
        if (current) {
          const { context, content } = current;
          NotebookActions.run(content, context.sessionContext);
        }
      },
      isEnabled
    });

  }

  get notebookPanel(): NotebookPanel {
    return this._notebookPanel;
  }

  get panel(): BoxPanel {
    return this._panel;
  }

  get manager(): ServiceManager {
    return this._serviceManager;
  }

  get commands(): CommandRegistry {
    return this._commands;
  }

}

export default NotebookAdapter;
