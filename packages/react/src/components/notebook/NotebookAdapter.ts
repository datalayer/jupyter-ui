/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { BoxPanel, Widget } from '@lumino/widgets';
import { IChangedArgs } from '@jupyterlab/coreutils';
import { Cell, ICellModel, MarkdownCell } from '@jupyterlab/cells';
import {
  Contents,
  ServiceManager,
  Kernel as JupyterKernel,
  SessionManager,
} from '@jupyterlab/services';
import { DocumentRegistry, Context } from '@jupyterlab/docregistry';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import {
  standardRendererFactories,
  RenderMimeRegistry,
} from '@jupyterlab/rendermime';
import { rendererFactory as jsonRendererFactory } from '@jupyterlab/json-extension';
import { rendererFactory as javascriptRendererFactory } from '@jupyterlab/javascript-extension';
import {
  Notebook,
  NotebookPanel,
  NotebookWidgetFactory,
  NotebookTracker,
  INotebookModel,
} from '@jupyterlab/notebook';
import {
  CodeMirrorEditorFactory,
  CodeMirrorMimeTypeService,
  EditorLanguageRegistry,
  EditorExtensionRegistry,
  EditorThemeRegistry,
  ybinding,
} from '@jupyterlab/codemirror';
import { IEditorServices } from '@jupyterlab/codeeditor';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  ProviderReconciliator,
  KernelCompleterProvider,
} from '@jupyterlab/completer';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import { INotebookContent, CellType, IAttachments } from '@jupyterlab/nbformat';
import { ISharedAttachmentsCell, IYText } from '@jupyter/ydoc';
import { WIDGET_MIMETYPE } from '@jupyter-widgets/html-manager/lib/output_renderers';
import { Lite } from '../../jupyter/JupyterContext';
import { Kernel } from '../../jupyter/kernel/Kernel';
import { ICellSidebarProps } from './cell/sidebar/CellSidebarWidget';
import JupyterReactContentFactory from './content/JupyterReactContentFactory';
import JupyterReactNotebookModelFactory from './model/JupyterReactNotebookModelFactory';
import { INotebookProps } from './Notebook';
import { NotebookCommands } from './NotebookCommands';
import getMarked from './marked/marked';
import { WidgetManager } from '../../jupyter/ipywidgets/lab/manager';
import { WidgetLabRenderer } from '../../jupyter/ipywidgets/lab/renderer';

const FALLBACK_NOTEBOOK_PATH = 'ping.ipynb';

export class NotebookAdapter {
  private _boxPanel: BoxPanel;
  private _commandRegistry: CommandRegistry;
  private _context?: Context<INotebookModel>;
  private _iPyWidgetsManager?: WidgetManager;
  private _kernel: Kernel;
  private _lite?: Lite;
  private _nbformat?: INotebookContent;
  private _nbgrader: boolean;
  private _notebookPanel?: NotebookPanel;
  private _path?: string;
  private _readonly: boolean;
  private _renderers: IRenderMime.IRendererFactory[];
  private _rendermime?: RenderMimeRegistry;
  private _serviceManager: ServiceManager.IManager;
  private _tracker?: NotebookTracker;
  private _id: string;
  private _CellSidebar?: (props: ICellSidebarProps) => JSX.Element;

  constructor(props: INotebookProps) {
    this._id = props.id;
    this._kernel = props.kernel!;
    this._lite = props.lite;
    this._nbformat = props.nbformat;
    this._nbgrader = props.nbgrader;
    this._path = props.path;
    this._readonly = props.readonly;
    this._renderers = props.renderers;
    this._serviceManager = props.serviceManager!;

    this._CellSidebar = props.CellSidebar;

    this._boxPanel = new BoxPanel();
    this._boxPanel.addClass('dla-Jupyter-Notebook');
    this._boxPanel.spacing = 0;

    this._commandRegistry = new CommandRegistry();

    if (props.url) {
      this.loadFromUrl(props.url).then((nbformat) => {
        this._nbformat = nbformat;
        this.setupAdapter();
      })
    }
    else {
      this.setupAdapter();
    }
  }

  async loadFromUrl(url: string) {
    return fetch(url).then(response => {
      return response.text();
    }).then(nb => {
      return JSON.parse(nb);
    });
  }

  notebookKeydownListener = (event: KeyboardEvent) => {
    this._commandRegistry?.processKeydownEvent(event);
  }

  private setupAdapter(): void {
    const useCapture = true;

    document.addEventListener( 'keydown', this.notebookKeydownListener, useCapture);

    const initialFactories = standardRendererFactories.filter(
      factory => factory.mimeTypes[0] !== 'text/javascript'
    );

    const ipywidgetsRendererFactory: IRenderMime.IRendererFactory =  {
      safe: true,
      mimeTypes: [WIDGET_MIMETYPE],
      defaultRank: 1,
      createRenderer: options =>
        new WidgetLabRenderer(options, this._iPyWidgetsManager!),
    };

    initialFactories.push(ipywidgetsRendererFactory);
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

    const documentRegistry = new DocumentRegistry({});
    const mimeTypeService = new CodeMirrorMimeTypeService(languages);

    const themes = new EditorThemeRegistry();
    for (const theme of EditorThemeRegistry.getDefaultThemes()) {
      themes.addTheme(theme);
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
      mimeTypeService,
    };
    const editorFactory = editorServices.factoryService.newInlineEditor;
    const contentFactory = this._CellSidebar
      ? new JupyterReactContentFactory(
          this._CellSidebar,
          this._id,
          this._nbgrader,
          this._commandRegistry,
          { editorFactory },
        )
      : new NotebookPanel.ContentFactory({ editorFactory });

    this._tracker = new NotebookTracker({ namespace: this._id });

    const notebookWidgetFactory = new NotebookWidgetFactory({
      name: 'Notebook',
      modelName: 'viewer',
      fileTypes: ['notebook'],
      defaultFor: ['notebook'],
      preferKernel: true,
      autoStartDefault: false,
      canStartKernel: false,
      shutdownOnClose: false,
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
      readonly: this._readonly,
    });
    documentRegistry.addModelFactory(notebookModelFactory);

    this._context = new Context({
      manager: this._serviceManager,
      factory: notebookModelFactory,
      path: this._path ?? FALLBACK_NOTEBOOK_PATH,
      kernelPreference: {
        id: this._kernel.id,
        shouldStart: false,
        canStart: false,
        autoStartDefault: false,
        shutdownOnDispose: false,
      },
    });

    this._iPyWidgetsManager = new WidgetManager(this._context, this._rendermime, {saveState: false});
    /*
    this._rendermime!.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: options =>
          new WidgetRenderer(options, this._iPyWidgetsManager!),
      },
      1
    );
    */
    /*
    // This code block was causing https://github.com/datalayer/jupyter-ui/issues/195
    // TODO Double check there is not side effect.
    this._context?.sessionContext
      .changeKernel({id: this._kernel.id })
      .then(() => {
        this._iPyWidgetsManager?.registerWithKernel(
          this._kernel.connection
        );
      });
    */
    // These are fixes to have more control on the kernel launch.
    (this._context.sessionContext as any)._initialize =
      async (): Promise<boolean> => {
        const manager = (this._context!.sessionContext as any)
          .sessionManager as SessionManager;
        await manager.ready;
        await manager.refreshRunning();
        const model = find(manager.running(), model => {
          return model.kernel?.id === this._kernel.id;
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
          } catch (err) {
            void (this._context!.sessionContext as any)._handleSessionError(
              err
            );
            return Promise.reject(err);
          }
        }
        return await (this._context!.sessionContext as any)._startIfNecessary();
      };

    this._context.sessionContext.kernelChanged.connect((_, args) => {
      console.log('Previous Jupyter Kernel connection', args.oldValue);
      const kernelConnection = args.newValue;
      console.log('Current Jupyter Kernel connection', kernelConnection);
      if (kernelConnection && !kernelConnection.handleComms) {
        console.warn(
          'The current Kernel Connection does not handle Comms',
          kernelConnection.id
        );
        (kernelConnection as any).handleComms = true;
        console.log(
          'The current Kernel Connection is updated to enforce Comms support',
          kernelConnection.handleComms
        );
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
    this._notebookPanel = documentRegistry
      .getWidgetFactory('Notebook')
      ?.createNew(this._context) as NotebookPanel;

    this._iPyWidgetsManager?.registerWithKernel(
      this._kernel.connection
    );

    this._notebookPanel!.sessionContext.kernelChanged.connect(
      (
        _: any,
        args: IChangedArgs<
          JupyterKernel.IKernelConnection | null,
          JupyterKernel.IKernelConnection | null,
          'kernel'
        >
      ) => {
        this._iPyWidgetsManager?.registerWithKernel(args.newValue);
      }
    );

    const completerHandler = this.setupCompleter(this._notebookPanel!);

    NotebookCommands(
      this._commandRegistry,
      this._notebookPanel,
      completerHandler,
      this._tracker,
      this._path
    );

    this._boxPanel.addWidget(this._notebookPanel);
    BoxPanel.setStretch(this._notebookPanel, 0);
    window.addEventListener('resize', () => {
      this._notebookPanel?.update();
    });
    const isNbFormat =
      this._path !== undefined && this._path !== '' ? false : true;
    if (isNbFormat && !this._lite) {
      // Fixes if nbformat is provided and we don't want to interact with the content manager.
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
    this._context.initialize(isNbFormat).then(() => {
      if (isNbFormat) {
        this._notebookPanel?.model?.fromJSON(this._nbformat!);
      }
    });
  }

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
    void sessionContext.ready.then(() => {
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

  assignKernel(kernel: Kernel) {
    this._kernel = kernel;
    this._context?.sessionContext.changeKernel({
      id: kernel.id,
    });
  }

  get id(): string {
    return this._id;
  }

  get readonly(): boolean {
    return this._readonly;
  }

  get lite(): Lite | undefined {
    return this._lite;
  }

  get kernel(): Kernel {
    return this._kernel;
  }

  get notebookPanel(): NotebookPanel | undefined {
    return this._notebookPanel;
  }

  get panel(): BoxPanel {
    return this._boxPanel;
  }

  get commands(): CommandRegistry {
    return this._commandRegistry;
  }

  get serviceManager(): ServiceManager.IManager {
    return this._serviceManager;
  }

  /*
   * Only use this method to change an already existing nbformat.
   */
  setNbformat(nbformat: INotebookContent) {
    if (nbformat === null) {
      throw new Error(
        'The nbformat should first be set via the constructor of NotebookAdapter'
      );
    }
    this._nbformat = nbformat;
    if (this._nbformat) {
      this._notebookPanel?.model?.fromJSON(nbformat);
    }
  }

  setReadonly(readonly: boolean) {
    if (this._readonly !== readonly) {
      this._readonly = readonly;
      Array.from(this._context?.model.cells!).forEach(cell => cell.setMetadata('editable', !readonly));
    }
  }

  setDefaultCellType = (cellType: CellType) => {
    this._notebookPanel!.content!.notebookConfig!.defaultCell! = cellType;
  };

  changeCellType = (cellType: CellType) => {
    //    NotebookActions.changeCellType(this._notebookPanel?.content!, cellType);
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
//    this._notebookPanel?.dispose();
//    this._boxPanel.dispose();
//    this._context?.dispose();
  };
}

export default NotebookAdapter;
