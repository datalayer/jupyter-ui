import { Store } from "redux";
import { CommandRegistry } from '@lumino/commands';
import { BoxPanel, Widget } from '@lumino/widgets';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { Cell, ICellModel, MarkdownCell } from '@jupyterlab/cells';
import { ServiceManager, Kernel as JupyterKernel } from '@jupyterlab/services';
import { DocumentRegistry, Context } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { standardRendererFactories, RenderMimeRegistry } from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { NotebookPanel, NotebookWidgetFactory, NotebookTracker, INotebookModel, Notebook } from '@jupyterlab/notebook';
import { CodeMirrorEditorFactory, CodeMirrorMimeTypeService, EditorLanguageRegistry, EditorExtensionRegistry, EditorThemeRegistry, ybinding } from '@jupyterlab/codemirror';
import { IEditorServices } from '@jupyterlab/codeeditor';
import { Completer, CompleterModel, CompletionHandler, ProviderReconciliator, KernelCompleterProvider } from '@jupyterlab/completer';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import { INotebookContent, CellType, IAttachments } from '@jupyterlab/nbformat';
import { ISharedAttachmentsCell, IYText } from '@jupyter/ydoc';
import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import { Kernel } from "./../../jupyter/services/kernel/Kernel";
import JupyterReactContentFactory from './content/JupyterReactContentFactory';
import JupyterReactNotebookModelFactory from './model/JupyterReactNotebookModelFactory';
import { INotebookProps, ExternalIPyWidgets, BundledIPyWidgets } from './Notebook';
import { NotebookCommands } from './NotebookCommands';
import { IPyWidgetsManager } from "../../jupyter/ipywidgets/IPyWidgetsManager";
import getMarked from './marked/marked';
import { managerPlugin, baseWidgetsPlugin, controlWidgetsPlugin, outputWidgetPlugin, externalIPyWidgetsPlugin, bundledIPyWidgetsPlugin } from "../../jupyter/ipywidgets/lab/plugin";
// import { activateWidgetExtension } from "../../jupyter/ipywidgets/lab2/IPyWidgetsJupyterLab";
// import { activatePlotlyWidgetExtension } from "./../../jupyter/ipywidgets/plotly/JupyterlabPlugin";

const FALLBACK_PATH = "ping.ipynb"

export class NotebookAdapter {
  private _boxPanel: BoxPanel;
  private _commandRegistry: CommandRegistry;
  private _context?: Context<INotebookModel>;
  private _bundledIPyWidgets?: BundledIPyWidgets[];
  private _externalIPyWidgets?: ExternalIPyWidgets[];
  private _iPyWidgetsClassicManager?: IPyWidgetsManager;
  private _ipywidgets: 'lab' | 'classic';
  private _kernel: Kernel;
  private _nbformat?: INotebookContent;
  private _nbgrader: boolean;
  private _notebookPanel?: NotebookPanel;
  private _path?: string;
  private _readOnly: boolean;
  private _renderers: IRenderMime.IRendererFactory[];
  private _rendermime?: RenderMimeRegistry;
  private _serviceManager: ServiceManager;
  private _store?: Store;
  private _tracker?: NotebookTracker;
  private _uid: string;
  private _CellSidebar?: (props: any) => JSX.Element;

  constructor(props: INotebookProps, store: any, serviceManager: ServiceManager) {
    this._bundledIPyWidgets = props.bundledIPyWidgets;
    this._externalIPyWidgets = props.externalIPyWidgets;
    this._ipywidgets = props.ipywidgets;
    this._kernel = props.kernel!;
    this._nbformat = props.nbformat;
    this._nbgrader = props.nbgrader;
    this._path = props.path;
    this._readOnly = props.readOnly;
    this._renderers = props.renderers;
    this._serviceManager = serviceManager;
    this._store = store;
    this._uid = props.uid;
    this._CellSidebar = props.CellSidebar;
    //
    this._boxPanel = new BoxPanel();
    this._boxPanel.addClass('dla-Jupyter-Notebook');
    this._boxPanel.spacing = 0;
    this._commandRegistry = new CommandRegistry();
    //
    this.loadNotebook();
  }

  private loadNotebook(): void {

    const useCapture = true;

    document.addEventListener(
      'keydown',
      event => { this._commandRegistry?.processKeydownEvent(event); },
      useCapture,
    );

    const rendererFactories = standardRendererFactories.filter(factory => factory.mimeTypes[0] !== 'text/javascript');
    rendererFactories.push(jsonRendererFactory);
    rendererFactories.push(javascriptRendererFactory);
    this._renderers.map(renderer => rendererFactories.push(renderer));

    const languages = new EditorLanguageRegistry();
    // Register default languages.
    for (const language of EditorLanguageRegistry.getDefaultLanguages()) {
      languages.addLanguage(language);
    }
    // Add Jupyter Markdown flavor here to support code block highlighting.
    languages.addLanguage({
      name: 'ipythongfm',
      mime: 'text/x-ipythongfm',
      load: async () => {
        // TODO: add support for LaTeX
        const m = await import('@codemirror/lang-markdown');
        return m.markdown({
          codeLanguages: (info: string) => languages.findBest(info) as any
        });
      }
    });

    this._rendermime = new RenderMimeRegistry({
      initialFactories: rendererFactories,
      latexTypesetter: new MathJaxTypesetter(),
      markdownParser: getMarked(languages),
    });

    const documentRegistry = new DocumentRegistry({});
    const mimeTypeService = new CodeMirrorMimeTypeService(languages);

    const themes = new EditorThemeRegistry();
    for (const theme of EditorThemeRegistry.getDefaultThemes()) {
      themes.addTheme(theme);
    }
    const editorExtensions = () => {
      const registry = new EditorExtensionRegistry();
      for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions({ themes })) {
        registry.addExtension(extensionFactory);
      }
      registry.addExtension({
        name: 'shared-model-binding',
        factory: options => {
          const sharedModel = options.model.sharedModel as IYText;
          return EditorExtensionRegistry.createImmutableExtension(
            ybinding({
              ytext: sharedModel.ysource,
              undoManager: sharedModel.undoManager ?? undefined
            })
          );
        }
      });
      return registry;
    }
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages
    });
    const editorServices: IEditorServices = {
      factoryService,
      mimeTypeService,
    };
    const editorFactory = editorServices.factoryService.newInlineEditor;
    const contentFactory = this._CellSidebar
    ?
      new JupyterReactContentFactory(
        this._CellSidebar,
        this._uid,
        this._nbgrader,
        this._commandRegistry,
        { editorFactory },
        this._store,
      )
    :
      new NotebookPanel.ContentFactory({ editorFactory });

    this._tracker = new NotebookTracker({ namespace: this._uid });

    const notebookWidgetFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      canStartKernel: false,
      rendermime: this._rendermime,
      contentFactory,
      mimeTypeService: editorServices.mimeTypeService,
    });

    notebookWidgetFactory.widgetCreated.connect((sender, notebookPanel) => {
      notebookPanel.context.pathChanged.connect(() => {
        this._tracker?.save(notebookPanel);
      });
      this._tracker?.add(notebookPanel);
    });

    documentRegistry.addWidgetFactory(notebookWidgetFactory);

    const notebookModelFactory = new JupyterReactNotebookModelFactory({
      nbformat: this._nbformat,
      readOnly: this._readOnly,
    });
    documentRegistry.addModelFactory(notebookModelFactory);

    switch(this._ipywidgets) { 
      case 'classic': {
        this._iPyWidgetsClassicManager = new IPyWidgetsManager({ loader: requireLoader });
        this._rendermime!.addFactory(
          {
            safe: false,
            mimeTypes: [WIDGET_MIMETYPE],
            createRenderer: (options) => new WidgetRenderer(options, this._iPyWidgetsClassicManager!),
          },
          1
        );
        break;
      }
      case 'lab': {
        const jupyterWidgetRegistry = managerPlugin.activate(this._rendermime, this._tracker, null, null, null, null);
        baseWidgetsPlugin.activate(jupyterWidgetRegistry);
        controlWidgetsPlugin.activate(jupyterWidgetRegistry);
        outputWidgetPlugin.activate(jupyterWidgetRegistry);
        break;
      }
    }
    
    this._context = new Context({
      manager: this._serviceManager,
      factory: notebookModelFactory,
      path: this._path ?? FALLBACK_PATH,
      kernelPreference: {
        id: this._kernel.serverId, // The core jupyterlab does not behave as expected.
        shouldStart: true,
        canStart: true,
        autoStartDefault: false,
        shutdownOnDispose: false,
      }
    });
    /*
    // Alternative way to create a NotebookPanel.
    const content = new Notebook({
      rendermime: this._rendermime!,
      contentFactory,
      mimeTypeService,
      notebookConfig: {
        ...StaticNotebook.defaultNotebookConfig,
        windowingMode: 'none'
      }
    });
    this._notebookPanel = new NotebookPanel({
      context: this._context,
      content,
    });
    */
    this._notebookPanel = documentRegistry.getWidgetFactory('Notebook')?.createNew(this._context) as NotebookPanel;

    switch(this._ipywidgets) { 
      case 'classic': {
        this._notebookPanel.sessionContext.kernelChanged.connect((
          sender: any, 
          args: IChangedArgs<JupyterKernel.IKernelConnection | null, JupyterKernel.IKernelConnection | null, 'kernel'>
        ) => {
          this._iPyWidgetsClassicManager?.registerWithKernel(args.newValue);
        });
        break;
      }
      case 'lab': {
        if (this._bundledIPyWidgets) {
          bundledIPyWidgetsPlugin(this._context, this._tracker, this._bundledIPyWidgets);
        }
        if (this._externalIPyWidgets) {
          externalIPyWidgetsPlugin(this._context, this._tracker, this._externalIPyWidgets);
        }
        break;
      }
    }
    
    const completerHandler = this.setupCompleter(this._notebookPanel!);
    NotebookCommands(this._commandRegistry, this._notebookPanel, completerHandler, this._tracker, this._path);

    this._boxPanel.addWidget(this._notebookPanel);
    BoxPanel.setStretch(this._notebookPanel, 0);
    window.addEventListener('resize', () => {
      this._notebookPanel?.update();
    });

    const isNew = ((this._path !== undefined) && (this._path !== "")) ? false : true;
    this._context.initialize(isNew).then(() => {
//      this.assignKernel(this._kernel!);
    });

  }

  setNbformat(nbformat: INotebookContent) {
    this._nbformat = nbformat;
    if (this._nbformat) {
      this._notebookPanel?.model?.fromJSON(nbformat);
    }
  }

  setupCompleter(notebookPanel: NotebookPanel) {
    const editor = notebookPanel.content.activeCell && notebookPanel.content.activeCell.editor;
    const sessionContext = notebookPanel.context.sessionContext;
    const completerModel = new CompleterModel();
    const completer = new Completer({ editor, model: completerModel });
    const completerTimeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: {
        widget: notebookPanel,
        editor,
        session: sessionContext.session
      },
      providers: [provider],
      timeout: completerTimeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    void sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      const reconciliator = new ProviderReconciliator({
        context: { widget: this._notebookPanel!, editor, session: sessionContext.session },
        providers: [provider],
        timeout: completerTimeout,
      });
      handler.reconciliator = reconciliator;
    });
    handler.editor = editor;
    notebookPanel.content.activeCellChanged.connect((sender: any, snippet: Cell<ICellModel>) => {
      handler.editor = snippet && snippet.editor;
    });
    completer.hide();
    Widget.attach(completer, document.body);
    return handler;
  }

  assignKernel(kernel: Kernel) {
    this._kernel = kernel;
    this._kernel.connection.then(kernelConnection => {
      this._context?.sessionContext.changeKernel({
        id: this._kernel?.serverId,
      }).then(() => {
        switch(this._ipywidgets) { 
          case 'classic': {
            this._iPyWidgetsClassicManager?.registerWithKernel(kernelConnection);
            break;
          }
        }
      });
    });
  }

  get uid(): string {
    return this._uid;
  }

  get notebookPanel(): NotebookPanel | undefined {
    return this._notebookPanel;
  }

  get commands(): CommandRegistry {
    return this._commandRegistry;
  }

  get panel(): BoxPanel {
    return this._boxPanel;
  }

  get serviceManager(): ServiceManager {
    return this._serviceManager;
  }

  setDefaultCellType = (cellType: CellType) => {
    this._notebookPanel!.content!.notebookConfig!.defaultCell! = cellType;
  }

  changeCellType = (cellType: CellType) => {
//    NotebookActions.changeCellType(this._notebookPanel?.content!, cellType);
    this.doChangeCellType(this._notebookPanel?.content!, cellType);
  }
    
  private doChangeCellType(
    notebook: Notebook,
    value: CellType
  ): void {
    const notebookSharedModel = notebook.model!.sharedModel;
    notebook.widgets.forEach((child, index) => {
      if (!notebook.isSelectedOrActive(child)) {
        return;
      }
      if (child.model.type !== value) {
        const raw = child.model.toJSON();
        notebookSharedModel.transact(() => {
          notebookSharedModel.deleteCell(index);
          const newCell = notebookSharedModel.insertCell(index, {
            cell_type: value,
            source: raw.source,
            metadata: raw.metadata
          });
          if (raw.attachments && ['markdown', 'raw'].includes(value)) {
            (newCell as ISharedAttachmentsCell).attachments =
              raw.attachments as IAttachments;
          }
        });
      }
      if (value === 'markdown') {
        // Fetch the new widget and unrender it.
        child = notebook.widgets[index];
        (child as MarkdownCell).rendered = false;
      }
    });
    notebook.deselectAll();
  }

  dispose = () => {
//    this._context?.dispose();
//    this._notebookPanel?.dispose();
  }

}

export default NotebookAdapter;
