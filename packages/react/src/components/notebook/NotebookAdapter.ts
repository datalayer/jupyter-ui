/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { WIDGET_MIMETYPE } from '@jupyter-widgets/html-manager/lib/output_renderers';
import { ISharedAttachmentsCell, IYText } from '@jupyter/ydoc';
import { Cell, ICellModel, MarkdownCell } from '@jupyterlab/cells';
import { IEditorServices } from '@jupyterlab/codeeditor';
import {
  CodeMirrorEditorFactory,
  CodeMirrorMimeTypeService,
  EditorExtensionRegistry,
  EditorLanguageRegistry,
  EditorThemeRegistry,
  ybinding,
} from '@jupyterlab/codemirror';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  KernelCompleterProvider,
  ProviderReconciliator,
} from '@jupyterlab/completer';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { Context, DocumentRegistry } from '@jupyterlab/docregistry';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import { CellType, IAttachments, INotebookContent } from '@jupyterlab/nbformat';
import {
  INotebookModel,
  Notebook,
  NotebookPanel,
  NotebookTracker,
  NotebookWidgetFactory,
  StaticNotebook,
} from '@jupyterlab/notebook';
import {
  RenderMimeRegistry,
  standardRendererFactories,
} from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import {
  Contents,
  Kernel as JupyterKernel,
  ServiceManager,
  Session,
  SessionManager,
} from '@jupyterlab/services';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { BoxPanel, Widget } from '@lumino/widgets';
import { Kernel, Lite, WidgetLabRenderer, WidgetManager } from '../../jupyter';
import { KernelTransfer, OnSessionConnection } from '../../state';
import { newUuid } from '../../utils';
import { JupyterReactContentFactory } from './content/JupyterReactContentFactory';
import { getMarked } from './marked/marked';
import { JupyterReactNotebookModelFactory } from './model/JupyterReactNotebookModelFactory';
import { INotebookProps } from './Notebook';
import { addNotebookCommands, NotebookPanelProvider } from './NotebookCommands';

const FALLBACK_NOTEBOOK_PATH = '.datalayer/ping.ipynb';

export class NotebookAdapter {
  private _boxPanel: BoxPanel;
  private _commands: CommandRegistry;
  private _contentFactory: JupyterReactContentFactory;
  private _context?: Context<INotebookModel>;
  private _documentRegistry?: DocumentRegistry;
  private _iPyWidgetsManager?: WidgetManager;
  private _id: string;
  private _kernel?: Kernel;
  private _kernelConnection: JupyterKernel.IKernelConnection | null | undefined;
  private _kernelClients?: JupyterKernel.IKernelConnection[];
  private _kernelTransfer?: KernelTransfer;
  private _lite?: Lite;
  private _mimeTypeService: CodeMirrorMimeTypeService;
  private _nbformat?: INotebookContent;
  private _notebookModelFactory?: JupyterReactNotebookModelFactory;
  private _notebookPanel?: NotebookPanel;
  private _onSessionConnection?: OnSessionConnection;
  private _panelProvider: NotebookPanelProvider;
  private _path?: string;
  private _readonly: boolean;
  private _renderers: IRenderMime.IRendererFactory[];
  private _rendermime?: RenderMimeRegistry;
  private _serverless: boolean;
  private _serviceManager: ServiceManager.IManager;
  private _tracker?: NotebookTracker;
  private _url?: string;

  private _useVSCodeTheme: boolean;

  constructor(props: INotebookProps) {
    console.log('Creating a new Notebook Adapter.');

    this._id = props.id ?? newUuid();
    this._kernel = props.kernel;
    this._kernelClients = props.kernelClients ?? [];
    this._lite = props.lite;
    this._nbformat = props.nbformat;
    this._path = props.path;
    this._readonly = props.readonly ?? false;
    this._renderers = props.renderers ?? [];
    this._serverless = props.serverless ?? false;
    this._serviceManager = props.serviceManager!;
    this._url = props.url;
    this._useVSCodeTheme = props.useVSCodeTheme ?? true; // Default to true for backwards compatibility

    this._kernelTransfer = props.kernelTransfer;
    this._onSessionConnection = props.onSessionConnection;

    this._boxPanel = new BoxPanel();
    this._boxPanel.addClass('dla-Jupyter-Notebook');
    this._boxPanel.spacing = 0;

    this._commands = new CommandRegistry();
    this._panelProvider = new NotebookPanelProvider();

    if (props.url) {
      this.loadFromUrl(props.url).then(nbformat => {
        this._nbformat = nbformat;
        this.setupAdapter();
      });
    } else {
      this.setupAdapter();
    }
  }

  async loadFromUrl(url: string) {
    return fetch(url)
      .then(response => {
        return response.text();
      })
      .then(nb => {
        return JSON.parse(nb);
      });
  }

  notebookKeydownListener = (event: KeyboardEvent) => {
    this._commands?.processKeydownEvent(event);
  };

  setupCompleter(notebookPanel: NotebookPanel) {
    const editor =
      notebookPanel.content.activeCell &&
      notebookPanel.content.activeCell.editor;
    const sessionContext = notebookPanel.context.sessionContext;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: {
        widget: notebookPanel,
        editor,
        session: sessionContext.session,
      },
      providers: [provider],
      timeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });

    sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      const reconciliator = new ProviderReconciliator({
        context: {
          widget: this._notebookPanel!,
          editor,
          session: sessionContext.session,
        },
        providers: [provider],
        timeout: timeout,
      });
      handler.reconciliator = reconciliator;
    });
    handler.editor = editor;
    notebookPanel.content.activeCellChanged.connect(
      (notebook: Notebook, cell: Cell<ICellModel> | null) => {
        if (cell) {
          cell.ready.then(() => {
            handler.editor = cell && cell.editor;
          });
        }
      }
    );
    completer.hide();
    Widget.attach(completer, document.body);
    return handler;
  }

  initializeContext() {
    const isNbFormat =
      this._path !== undefined && this._path !== '' ? false : true;

    this._context = new Context({
      manager: this._serviceManager,
      factory: this._notebookModelFactory!,
      path: this._path ?? FALLBACK_NOTEBOOK_PATH,
      kernelPreference: {
        id: this._kernel?.id,
        shouldStart: false,
        canStart: false,
        autoStartDefault: false,
        shutdownOnDispose: false,
      },
    });

    this._iPyWidgetsManager = new WidgetManager(
      this._context,
      this._rendermime!,
      { saveState: false }
    );
    const ipywidgetsRendererFactory: IRenderMime.IRendererFactory = {
      safe: true,
      mimeTypes: [WIDGET_MIMETYPE],
      defaultRank: 1,
      createRenderer: options =>
        new WidgetLabRenderer(options, this._iPyWidgetsManager),
    };
    this._rendermime!.addFactory(ipywidgetsRendererFactory, 1);
    this._kernelClients?.map(kernelClient => {
      this._iPyWidgetsManager?.registerWithKernel(kernelClient);
    });

    // These are fixes on the Context and the SessionContext to have more control on the kernel launch.
    (this._context.sessionContext as any)._initialize =
      async (): Promise<boolean> => {
        const manager = (this._context!.sessionContext as any)
          .sessionManager as SessionManager;
        await manager.ready;
        await manager.refreshRunning();
        const model = find(manager.running(), model => {
          return model.kernel?.id === this._kernel?.id;
        });
        if (model) {
          try {
            const session = manager.connectTo({
              model: {
                ...model,
                path: this._path ?? model.path,
                name: this._path ?? model.name,
              },
              kernelConnectionOptions: {
                handleComms: true,
              },
            });
            (this._context!.sessionContext as any)._handleNewSession(session);
            // Dispose the previous KernelConnection to avoid errors with Comms.
            this._kernel?.connection?.dispose();
          } catch (err) {
            void (this._context!.sessionContext as any)._handleSessionError(
              err
            );
            return Promise.reject(err);
          }
        }
        return await (this._context!.sessionContext as any)._startIfNecessary();
      };
    if (isNbFormat) {
      // If nbformat is provided and we don't want to interact with the Content Manager.
      (this._context as any)._populate = async (): Promise<void> => {
        (this._context as any)._isPopulated = true;
        (this._context as any)._isReady = true;
        (this._context as any)._populatedPromise.resolve(void 0);
        // Add a checkpoint if none exists and the file is writable.
        // Force skip this step for nbformat notebooks.
        // await (this._context as any)._maybeCheckpoint(false);
        if ((this._context as any).isDisposed) {
          return;
        }
        // Update the kernel preference.
        const name =
          (this._context as any)._model.defaultKernelName ||
          (this._context as any).sessionContext.kernelPreference.name;
        (this._context as any).sessionContext.kernelPreference = {
          ...(this._context as any).sessionContext.kernelPreference,
          name,
          language: (this._context as any)._model.defaultKernelLanguage,
        };
        // Note: we don't wait on the session to initialize
        // so that the user can be shown the content before
        // any kernel has started.
        void (this._context as any).sessionContext
          .initialize()
          .then((shouldSelect: boolean) => {
            if (shouldSelect) {
              void (this._context as any)._dialogs.selectKernel(
                (this._context!.sessionContext as any).sessionContext
              );
            }
          });
      };
      (this._context as any).initialize = async (
        isNew: boolean
      ): Promise<void> => {
        (this._context as Context<INotebookModel>).model.dirty = false;
        const now = new Date().toISOString();
        const model: Contents.IModel = {
          path: this._id,
          name: this._id,
          type: 'notebook',
          content: undefined,
          writable: true,
          created: now,
          last_modified: now,
          mimetype: 'application/x-ipynb+json',
          format: 'json',
        };
        (this._context as any)._updateContentsModel(model);
        await (this._context as any)._populate();
        (
          this._context as Context<INotebookModel>
        ).model.sharedModel.clearUndoHistory();
      };
    }

    // Setup the context listeners.
    this._context.sessionContext.sessionChanged.connect(
      (
        _,
        args: IChangedArgs<
          Session.ISessionConnection | null,
          Session.ISessionConnection | null,
          'session'
        >
      ) => {
        const session = args.newValue;
        console.log('Current Jupyter Session Connection', session);
        if (this._onSessionConnection) {
          if (session) {
            this._onSessionConnection(session);
            this._iPyWidgetsManager?.registerWithKernel(session.kernel);
            const model = this._notebookPanel?.model;
            if (model) {
              this._iPyWidgetsManager?.restoreWidgets(model);
            }
          }
        }
      }
    );
    this._context.sessionContext.kernelChanged.connect(
      (
        _,
        args: IChangedArgs<
          JupyterKernel.IKernelConnection | null,
          JupyterKernel.IKernelConnection | null,
          'kernel'
        >
      ) => {
        const kernelConnection = args.newValue;
        this._kernelConnection = kernelConnection;
        console.log('Current Jupyter Kernel Connection.', kernelConnection);
        if (kernelConnection && !kernelConnection.handleComms) {
          console.log(
            'Updating the current Kernel Connection to enforce Comms support.',
            kernelConnection.handleComms
          );
          (kernelConnection as any).handleComms = true;
        }
        /*
      this._iPyWidgetsManager?.registerWithKernel(kernelConnection);
      this._iPyWidgetsManager?.restoreWidgets(this._notebookPanel?.model!)
      if (this._onSessionConnection) {
        this._onSessionConnection(kernelConnection);
      }
      */
      }
    );
    this._context.sessionContext.ready.then(() => {
      if (this._onSessionConnection) {
        this._onSessionConnection(
          this._context?.sessionContext.session ?? undefined
        );
      }
      const kernelConnection = this._context?.sessionContext.session?.kernel;
      this._kernelConnection = kernelConnection;
      if (this._kernelTransfer) {
        if (kernelConnection) {
          kernelConnection.connectionStatusChanged.connect((_, status) => {
            if (status === 'connected') {
              this._kernelTransfer!.transfer(kernelConnection);
            }
          });
        }
      }
    });

    if (!this._notebookPanel) {
      // Create the Notebook Panel if not yet done.
      /*
      // Option 1 to create the Notebook Panel.
      const content = new Notebook({
        rendermime: this._rendermime!,
        contentFactory: this._contentFactory,
        mimeTypeService: this._mimeTypeService,
        notebookConfig: {
          ...StaticNotebook.defaultNotebookConfig,
          windowingMode: 'none',
          recordTiming: true,
        }
      });
      this._notebookPanel = new NotebookPanel({
        context: this._context,
        content,
      });
      */
      // Option 2 to create the Notebook Panel.
      const notebookFactory =
        this._documentRegistry?.getWidgetFactory('Notebook');
      this._notebookPanel = notebookFactory?.createNew(
        this._context
      ) as NotebookPanel;

      // Update panel provider with persistent references
      this._panelProvider.setPanel(this._notebookPanel, this._context);
    }

    const completerHandler = this.setupCompleter(this._notebookPanel!);

    if (!this._readonly) {
      try {
        addNotebookCommands(
          this._commands,
          completerHandler,
          this._tracker!,
          this._panelProvider,
          this._path
        );
      } catch {
        // no-op.
        // The commands may already be registered...
      }
    }

    this._boxPanel.addWidget(this._notebookPanel);
    BoxPanel.setStretch(this._notebookPanel, 0);
    window.addEventListener('resize', () => {
      this._notebookPanel?.update();
    });

    this._context.initialize(isNbFormat).then(() => {
      if (isNbFormat) {
        this._notebookPanel?.model?.fromJSON(this._nbformat!);
      }
    });
  }

  private setupAdapter(): void {
    document.addEventListener('keydown', this.notebookKeydownListener, true);

    const initialFactories = standardRendererFactories.filter(
      factory => factory.mimeTypes[0] !== 'text/javascript'
    );
    /*
    const ipywidgetsRendererFactory: IRenderMime.IRendererFactory =  {
      safe: true,
      mimeTypes: [WIDGET_MIMETYPE],
      defaultRank: 1,
      createRenderer: options =>
        new WidgetLabRenderer(options, this._iPyWidgetsManager!),
    };
    initialFactories.push(ipywidgetsRendererFactory);
    */
    initialFactories.push(jsonRendererFactory);
    initialFactories.push(javascriptRendererFactory);

    this._renderers.map(renderer => initialFactories.push(renderer));

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
        // TODO: add support for LaTeX.
        const m = await import('@codemirror/lang-markdown');
        return m.markdown({
          codeLanguages: (info: string) => languages.findBest(info) as any,
        });
      },
    });

    this._rendermime = new RenderMimeRegistry({
      initialFactories,
      latexTypesetter: new MathJaxTypesetter(),
      markdownParser: getMarked(languages),
    });

    this._documentRegistry = new DocumentRegistry({});
    this._mimeTypeService = new CodeMirrorMimeTypeService(languages);

    const themes = new EditorThemeRegistry();
    for (const theme of EditorThemeRegistry.getDefaultThemes()) {
      themes.addTheme(theme);
    }
    // Store useVSCodeTheme flag on window for the patch to access
    if (typeof window !== 'undefined') {
      (window as any).__useVSCodeTheme = this._useVSCodeTheme;
    }
    const editorExtensions = () => {
      const registry = new EditorExtensionRegistry();
      for (const extensionFactory of EditorExtensionRegistry.getDefaultExtensions(
        { themes }
      )) {
        registry.addExtension(extensionFactory);
      }
      registry.addExtension({
        name: 'shared-model-binding',
        factory: options => {
          const sharedModel = options.model.sharedModel as IYText;
          return EditorExtensionRegistry.createImmutableExtension(
            ybinding({
              ytext: sharedModel.ysource,
              undoManager: sharedModel.undoManager ?? undefined,
            })
          );
        },
      });
      return registry;
    };
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages,
    });
    const editorServices: IEditorServices = {
      factoryService,
      mimeTypeService: this._mimeTypeService,
    };
    const editorFactory = editorServices.factoryService.newInlineEditor;
    this._contentFactory = new JupyterReactContentFactory({ editorFactory });

    this._tracker = new NotebookTracker({ namespace: this._id });

    const notebookWidgetFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      label: 'Notebook',
      modelName: 'notebook',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      autoStartDefault: false,
      canStartKernel: false,
      shutdownOnClose: false,
      rendermime: this._rendermime,
      contentFactory: this._contentFactory,
      mimeTypeService: editorServices.mimeTypeService,
      notebookConfig: {
        ...StaticNotebook.defaultNotebookConfig,
        recordTiming: true,
      },
    });
    notebookWidgetFactory.widgetCreated.connect((sender, notebookPanel) => {
      notebookPanel.context.pathChanged.connect(() => {
        this._tracker?.save(notebookPanel);
      });
      this._tracker?.add(notebookPanel);
    });
    this._documentRegistry.addWidgetFactory(notebookWidgetFactory);

    this._notebookModelFactory = new JupyterReactNotebookModelFactory({
      nbformat: this._nbformat,
      readonly: this._readonly,
    });
    this._documentRegistry.addModelFactory(this._notebookModelFactory);

    this.initializeContext();
  }

  get id(): string {
    return this._id;
  }

  get readonly(): boolean {
    return this._readonly;
  }

  get serverless(): boolean {
    return this._serverless;
  }

  get lite(): Lite | undefined {
    return this._lite;
  }

  get path(): string | undefined {
    return this._path;
  }

  get url(): string | undefined {
    return this._url;
  }

  get nbformat(): INotebookContent | undefined {
    return this._nbformat;
  }

  get kernel(): Kernel | undefined {
    return this._kernel;
  }

  get kernelConnection(): JupyterKernel.IKernelConnection | null | undefined {
    return this._kernelConnection;
  }

  get notebookPanel(): NotebookPanel | undefined {
    return this._notebookPanel;
  }

  get context(): Context<INotebookModel> | undefined {
    return this._context;
  }

  set notebookPanel(notebookPanel: NotebookPanel | undefined) {
    this._notebookPanel = notebookPanel;
  }

  get panel(): BoxPanel {
    return this._boxPanel;
  }

  get commands(): CommandRegistry {
    return this._commands;
  }

  get serviceManager(): ServiceManager.IManager {
    return this._serviceManager;
  }

  /*
   * Only use this method to change an adapter with a nbformat.
   */
  setNbformat(nbformat?: INotebookContent) {
    if (!nbformat) {
      throw new Error(
        'The nbformat should first be set via the constructor of NotebookAdapter'
      );
    }
    if (this._nbformat !== nbformat) {
      this._nbformat = nbformat;
      this._notebookPanel?.model?.fromJSON(nbformat);
    }
  }

  setServiceManager(serviceManager: ServiceManager.IManager, lite?: Lite) {
    this._lite = lite;
    this._serviceManager = serviceManager;
    this._nbformat = this._notebookPanel?.model?.toJSON() as INotebookContent;
    //    this.initializeContext();
  }

  setKernel(kernel?: Kernel) {
    if (this._kernel === kernel) {
      return;
    }
    this._kernel = kernel;
    this.initializeContext();
  }

  setReadonly(readonly: boolean) {
    if (this._readonly !== readonly) {
      this._readonly = readonly;
      this._notebookPanel?.content.widgets.forEach(cell => {
        cell.syncEditable = true;
        cell.model.sharedModel.setMetadata('editable', !readonly);
      });
      const cells = this._context?.model.cells;
      if (cells) {
        Array.from(cells).forEach(cell => {
          cell.setMetadata('editable', !readonly);
        });
      }
      this._notebookPanel?.content.widgets.forEach(cell => {
        cell.saveEditableState();
      });
    }
  }

  setServerless(serverless: boolean) {
    if (this._serverless !== serverless) {
      this._serverless = serverless;
      //      this.initializeContext();
    }
  }

  setPath(path: string) {
    if (this._path !== path) {
      this._path = path;
      this.initializeContext();
    }
  }

  assignKernel(kernel: Kernel) {
    this._kernel = kernel;
    this._context?.sessionContext.changeKernel({
      id: kernel.id,
    });
  }

  setDefaultCellType = (cellType: CellType) => {
    this._notebookPanel!.content!.notebookConfig!.defaultCell! = cellType;
  };

  changeCellType = (cellType: CellType) => {
    // NotebookActions.changeCellType(this._notebookPanel?.content!, cellType);
    const notebook = this._notebookPanel!.content!;
    const notebookSharedModel = notebook.model!.sharedModel;
    notebook.widgets.forEach((child, index) => {
      if (!notebook.isSelectedOrActive(child)) {
        return;
      }
      if (child.model.type !== cellType) {
        const raw = child.model.toJSON();
        notebookSharedModel.transact(() => {
          notebookSharedModel.deleteCell(index);
          const newCell = notebookSharedModel.insertCell(index, {
            cell_type: cellType,
            source: raw.source,
            metadata: raw.metadata,
          });
          if (raw.attachments && ['markdown', 'raw'].includes(cellType)) {
            (newCell as ISharedAttachmentsCell).attachments =
              raw.attachments as IAttachments;
          }
        });
      }
      if (cellType === 'markdown') {
        // Fetch the new widget and unrender it.
        child = notebook.widgets[index];
        (child as MarkdownCell).rendered = false;
      }
    });
    notebook.deselectAll();
  };

  insertAbove = (source?: string): void => {
    const notebook = this._notebookPanel!.content!;
    const model = this._notebookPanel!.context.model!;
    const newIndex = notebook.activeCell ? notebook.activeCellIndex : 0;
    model.sharedModel.insertCell(newIndex, {
      cell_type: notebook.notebookConfig.defaultCell,
      source,
      metadata:
        notebook.notebookConfig.defaultCell === 'code'
          ? {
              // This is an empty cell created by user, thus is trusted
              trusted: true,
            }
          : {},
    });
    // Make the newly inserted cell active.
    notebook.activeCellIndex = newIndex;
    notebook.deselectAll();
  };

  insertBelow = (source?: string): void => {
    const notebook = this._notebookPanel!.content!;
    const model = this._notebookPanel!.context.model!;
    const newIndex = notebook.activeCell ? notebook.activeCellIndex + 1 : 0;
    model.sharedModel.insertCell(newIndex, {
      cell_type: notebook.notebookConfig.defaultCell,
      source,
      metadata:
        notebook.notebookConfig.defaultCell === 'code'
          ? {
              // This is an empty cell created by user, thus is trusted.
              trusted: true,
            }
          : {},
    });
    // Make the newly inserted cell active.
    notebook.activeCellIndex = newIndex;
    notebook.deselectAll();
  };

  dispose = () => {
    document.removeEventListener('keydown', this.notebookKeydownListener, true);
    this._context?.dispose();
    this._notebookPanel?.dispose();
    this._boxPanel.dispose();
  };
}

export default NotebookAdapter;
