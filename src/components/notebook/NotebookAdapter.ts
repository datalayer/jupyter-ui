import { CommandRegistry } from '@lumino/commands';
import { ReadonlyPartialJSONObject } from '@lumino/coreutils';
import { BoxPanel, Widget } from '@lumino/widgets';
import { IChangedArgs, PageConfig } from '@jupyterlab/coreutils';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { Kernel, ServerConnection, ServiceManager } from '@jupyterlab/services';
import { DocumentRegistry, Context} from '@jupyterlab/docregistry';
import { standardRendererFactories as initialFactories, RenderMimeRegistry } from '@jupyterlab/rendermime';
import { NotebookModelFactory, NotebookPanel, NotebookWidgetFactory, NotebookTracker, NotebookActions } from '@jupyterlab/notebook';
import { CodeMirrorEditorFactory, CodeMirrorMimeTypeService } from '@jupyterlab/codemirror';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { Completer, CompleterModel, CompletionHandler, ConnectorProxy, KernelCompleterProvider } from '@jupyterlab/completer';
import { MathJaxTypesetter } from '@jupyterlab/mathjax2';
import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import { INotebookProps } from './Notebook';
import { NotebookCommands } from './NotebookCommands';
import ContentFactoryWithSidebar from './content/ContentFactoryWithSidebar';
import { IPyWidgetsClassicManager } from "../../ipywidgets/IPyWidgetsClassicManager";
import { activateWidgetExtension } from "../../ipywidgets/IPyWidgetsJupyterLabPlugin";
import { activatePlotlyWidgetExtension } from "../../ipywidgets/plotly/jupyterlab-plugin";

import '@jupyterlab/notebook/style/index.css';
import '@jupyterlab/completer/style/index.css';
import '@jupyterlab/documentsearch/style/index.css';
import '@jupyterlab/theme-light-extension/style/theme.css';
import '@jupyterlab/theme-light-extension/style/variables.css';

import './NotebookAdapter.css';

class NotebookAdapter {
  private props: INotebookProps;
  private boxPanel: BoxPanel;
  private _notebookPanel: NotebookPanel;
  private commandRegistry: CommandRegistry;
  private serverSettings: ServerConnection.ISettings;
  private serviceManager: ServiceManager;
  private iPyWidgetsClassicManager: IPyWidgetsClassicManager;
  private store: any;

  constructor(props: INotebookProps, injectableStore: any) {
    this.props = props;
    this.boxPanel = new BoxPanel();
    this.boxPanel.addClass('dla-JupyterLab-Notebook');
    this.boxPanel.spacing = 0;
    this.loadNotebook = this.loadNotebook.bind(this);
    this.serverSettings = ServerConnection.makeSettings({
      appendToken: true,
      init: {
        credentials: "include",
        mode: 'cors',
      }
    });
    this.serviceManager = new ServiceManager({
      serverSettings: this.serverSettings,
    });
    this.store = injectableStore;
  }

  loadNotebook(notebookPath: string): void {
    this.commandRegistry = new CommandRegistry();
    const useCapture = true;
    document.addEventListener(
      'keydown',
      event => {
        this.commandRegistry.processKeydownEvent(event);
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
    const documentRegistry = new DocumentRegistry({});
    const mimeTypeService = new CodeMirrorMimeTypeService();
    const editorServices: IEditorServices = {
      factoryService: new CodeMirrorEditorFactory(),
      mimeTypeService,
    };
    const editorFactory = editorServices.factoryService.newInlineEditor;
    const contentFactory = this.props.sidebarComponent ? 
      new ContentFactoryWithSidebar(
        this.props.sidebarComponent,
        this.commandRegistry,
        this.store,
        { editorFactory }
      ) :
      new NotebookPanel.ContentFactory({ editorFactory });
    const tracker = new NotebookTracker({ namespace: 'notebook' });
    if (this.props.ipywidgets === 'classic') {
      this.iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
      rendermime.addFactory(
        {
          safe: false,
          mimeTypes: [WIDGET_MIMETYPE],
          createRenderer: (options) => new WidgetRenderer(options, this.iPyWidgetsClassicManager),
        },
        1
      );
    }
    else if (this.props.ipywidgets === 'lab') {
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
      mimeTypeService: editorServices.mimeTypeService,
    });
    notebookWidgetFactory.widgetCreated.connect((sender, widget) => {
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      void tracker.add(widget);
    });
    documentRegistry.addWidgetFactory(notebookWidgetFactory);
    const notebookModelFactory = new NotebookModelFactory({});
    documentRegistry.addModelFactory(notebookModelFactory);
    const context = new Context({
      manager: this.serviceManager,
      factory: notebookModelFactory,
      path: notebookPath,
      kernelPreference: {
        shouldStart: true,
        name: 'python3',
      }
    });
    this._notebookPanel = documentRegistry.getWidgetFactory('notebook')?.createNew(context) as NotebookPanel;
    const setupCompleter = (notebookPanel: NotebookPanel) => {
      const editor = notebookPanel.content.activeCell && notebookPanel.content.activeCell.editor;
      const sessionContext = notebookPanel.context.sessionContext;
      const completerModel = new CompleterModel();
      const completer = new Completer({ editor, model: completerModel });
      const completerTimeout = 1000;
      const provider = new KernelCompleterProvider();
      const connector = new ConnectorProxy(
        {
          widget: notebookPanel,
          editor,
          session: sessionContext.session
        },
        [provider],
        completerTimeout,
      );
      const handler = new CompletionHandler({ completer, connector });
      void sessionContext.ready.then(() => {
        const provider = new KernelCompleterProvider();
        const connector = new ConnectorProxy(
          { widget: this._notebookPanel!, editor, session: sessionContext.session },
          [provider],
          completerTimeout,
        );
        handler.connector = connector;
      });
      handler.editor = editor;
      notebookPanel.content.activeCellChanged.connect((sender: any, cell: Cell<ICellModel>) => {
        handler.editor = cell && cell.editor;
      });
      completer.hide();
      Widget.attach(completer, document.body);
      return handler;
    }
    context.initialize(false).then(() => {
        const completerHandler = setupCompleter(this._notebookPanel!);
        NotebookCommands(this.commandRegistry, this._notebookPanel!, completerHandler);  
      });
    if (this.props.ipywidgets === 'classic') {
      this._notebookPanel.sessionContext.kernelChanged.connect((sender: any, args: IChangedArgs<Kernel.IKernelConnection | null, Kernel.IKernelConnection | null, 'kernel'>) => {
        this.iPyWidgetsClassicManager.registerWithKernel(args.newValue);
      });
    }
    BoxPanel.setStretch(this._notebookPanel, 0);
    this.boxPanel.addWidget(this._notebookPanel);
    window.addEventListener('resize', () => {
      this._notebookPanel.update();
    });
    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = tracker.currentWidget;
      return widget;
    }
    function isEnabled(): boolean {
      return (
        tracker.currentWidget !== null
      );
    }
    this.commandRegistry.addCommand('run-selected-codecell', {
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
    return this.boxPanel;
  }

  get manager(): ServiceManager {
    return this.serviceManager;
  }

  get commands(): CommandRegistry {
    return this.commandRegistry;
  }

}

export default NotebookAdapter;
