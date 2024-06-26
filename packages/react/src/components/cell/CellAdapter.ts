/*
 * Copyright (c) 2021-2023 Datalayer, Inc.
 *
 * MIT License
 */

import { BoxPanel, Widget } from '@lumino/widgets';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import {
  SessionContext,
  ISessionContext,
  Toolbar,
  ToolbarButton,
} from '@jupyterlab/apputils';
import { CodeCellModel, CodeCell, Cell, MarkdownCell, RawCell, MarkdownCellModel } from '@jupyterlab/cells';
import {
  ybinding,
  CodeMirrorMimeTypeService,
  EditorLanguageRegistry,
  CodeMirrorEditorFactory,
  EditorExtensionRegistry,
  EditorThemeRegistry,
} from '@jupyterlab/codemirror';
import { MathJaxTypesetter } from '@jupyterlab/mathjax-extension';
import {
  Completer,
  CompleterModel,
  CompletionHandler,
  ProviderReconciliator,
  KernelCompleterProvider,
} from '@jupyterlab/completer';
import {
  RenderMimeRegistry,
  standardRendererFactories as initialFactories,
} from '@jupyterlab/rendermime';
import {
  Session,
  ServerConnection,
  SessionManager,
  KernelManager,
  KernelSpecManager,
} from '@jupyterlab/services';
import { runIcon } from '@jupyterlab/ui-components';
import { createStandaloneCell, YCodeCell, IYText, YMarkdownCell } from '@jupyter/ydoc';
import {
  WIDGET_MIMETYPE,
  WidgetRenderer,
} from '@jupyter-widgets/html-manager/lib/output_renderers';
import { requireLoader as loader } from '../../jupyter/ipywidgets/libembed-amd';
import ClassicWidgetManager from '../../jupyter/ipywidgets/classic/manager';
import Kernel from '../../jupyter/kernel/Kernel';
import getMarked from '../notebook/marked/marked';
import CellCommands from './CellCommands';

interface BoxOptions {
  showToolbar?: boolean;
}
export class CellAdapter {
  private _cell: CodeCell | MarkdownCell | RawCell;
  private _kernel: Kernel;
  private _panel: BoxPanel;
  private _sessionContext: SessionContext;
  private _type: 'code' | 'markdown' | 'raw'

  constructor(options: CellAdapter.ICellAdapterOptions) {
    const { type, source, serverSettings, kernel, boxOptions } = options;
    this._kernel = kernel;
    this._type = type;
    this.setupCell(type, source, serverSettings, kernel, boxOptions);
  }

  private setupCell(
    type = 'code',
    source: string,
    serverSettings: ServerConnection.ISettings,
    kernel: Kernel,
    boxOptions?: BoxOptions
  ) {
    const kernelManager =
      kernel.kernelManager ??
      new KernelManager({
        serverSettings,
      });
    const sessionManager =
      kernel.sessionManager ??
      new SessionManager({
        serverSettings,
        kernelManager,
      });
    const specsManager =
      kernel.kernelSpecManager ??
      new KernelSpecManager({
        serverSettings,
      });
    const kernelPreference: ISessionContext.IKernelPreference = kernel
      ? {
          id: kernel.id,
          shouldStart: false,
          autoStartDefault: false,
          shutdownOnDispose: false,
        }
      : {
          name: 'python',
          shouldStart: true,
          autoStartDefault: true,
          shutdownOnDispose: true,
        };

    this._sessionContext = new SessionContext({
      name: kernel?.path,
      path: kernel?.path,
      sessionManager,
      specsManager,
      type: 'python',
      kernelPreference,
    });

    // These are fixes to have more control on the kernel launch.
    (this._sessionContext as any)._initialize = async (): Promise<boolean> => {
      const manager = (this._sessionContext as any)
        .sessionManager as SessionManager;
      await manager.ready;
      await manager.refreshRunning();
      const model = find(manager.running(), item => {
        //          return (item as any).path === (this._sessionContext as any)._path;
        return item.kernel?.id === this._kernel.id;
      });
      if (model) {
        try {
          const session = manager.connectTo({
            model,
            kernelConnectionOptions: {
              handleComms: true,
            },
          });
          (this._sessionContext as any)._handleNewSession(session);
        } catch (err) {
          void (this._sessionContext as any)._handleSessionError(err);
          return Promise.reject(err);
        }
      }
      return await (this._sessionContext as any)._startIfNecessary();
    };

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
    const languages = new EditorLanguageRegistry();
    for (const language of EditorLanguageRegistry.getDefaultLanguages()) {
      languages.addLanguage(language);
    }
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
    const mimeService = new CodeMirrorMimeTypeService(languages);
    const commands = new CommandRegistry();
    const useCapture = true;
    document.addEventListener(
      'keydown',
      event => {
        commands.processKeydownEvent(event);
      },
      useCapture
    );
    const rendermime = new RenderMimeRegistry({
      initialFactories,
      latexTypesetter: new MathJaxTypesetter(),
      markdownParser: getMarked(languages),
    });
    const iPyWidgetsClassicManager = new ClassicWidgetManager({ loader });
    rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: options =>
          new WidgetRenderer(options, iPyWidgetsClassicManager),
      },
      0
    );
    iPyWidgetsClassicManager.registerWithKernel(kernel.connection);
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages,
    });

    const cellModel = createStandaloneCell({
      cell_type: type,
      source: source,
      metadata: {},
    });
    const contentFactory = new Cell.ContentFactory({
      editorFactory: factoryService.newInlineEditor.bind(factoryService),
    });
    if (type === 'code') {
      this._cell = new CodeCell({
        rendermime,
        model: new CodeCellModel({sharedModel: cellModel as YCodeCell}),
        contentFactory: contentFactory,
      });
    }  else if (type === 'markdown') {
      this._cell = new MarkdownCell({
        rendermime,
        model: new MarkdownCellModel({sharedModel: cellModel as YMarkdownCell}),
        contentFactory: contentFactory,
      });
    }
    this._cell.addClass('dla-Jupyter-Cell');
    this._cell.initializeState();
    if (this._type === 'markdown') {
      (this._cell as MarkdownCell).rendered = false;
    }

    this._sessionContext.kernelChanged.connect(
      (_, arg: Session.ISessionConnection.IKernelChangedArgs) => {
        const kernelConnection = arg.newValue;
        console.log('Current Kernel Connection', kernelConnection);
        if (kernelConnection && !kernelConnection.handleComms) {
          console.warn(
            'Kernel Connection does not handle Comms',
            kernelConnection.id
          );
          (kernelConnection as any).handleComms = true;
          console.log(
            'Kernel Connection is updated to enforce Comms support',
            kernelConnection.handleComms
          );
        }
        iPyWidgetsClassicManager.registerWithKernel(kernelConnection);
      }
    );
    this._sessionContext.kernelChanged.connect(() => {
      void this._sessionContext.session?.kernel?.info.then(info => {
        if (this._type === 'code') {
          const lang = info.language_info;
          const mimeType = mimeService.getMimeTypeByLanguage(lang);
          this._cell.model.mimeType = mimeType;
        }
      });
    });
    const editor = this._cell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: {
        widget: this._cell,
        editor,
        session: this._sessionContext.session,
      },
      providers: [provider],
      timeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    void this._sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      handler.reconciliator = new ProviderReconciliator({
        context: {
          widget: this._cell,
          editor,
          session: this._sessionContext.session,
        },
        providers: [provider],
        timeout,
      });
    });
    handler.editor = editor;

    CellCommands(commands, this._cell!, this._sessionContext, handler);
    completer.hide();
    completer.addClass('jp-Completer-Cell');
    Widget.attach(completer, document.body);
    const toolbar = new Toolbar();
    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    const runButton = new ToolbarButton({
      icon: runIcon,
      onClick: () => {
        if (this._type === 'code') {
          CodeCell.execute(this._cell as CodeCell, this._sessionContext);
        } else if (this._type === 'markdown') {
          (this._cell as MarkdownCell).rendered = true;
        }
      },
      tooltip: 'Run',
    });
    toolbar.addItem('run', runButton);
    toolbar.addItem(
      'interrupt',
      Toolbar.createInterruptButton(this._sessionContext)
    );
    toolbar.addItem(
      'restart',
      Toolbar.createRestartButton(this._sessionContext)
    );
    // toolbar.addItem('name', Toolbar.createKernelNameItem(this._sessionContext));
    toolbar.addItem(
      'status',
      Toolbar.createKernelStatusItem(this._sessionContext)
    );

    if (this._type === 'code') {
      (this._cell as CodeCell).outputsScrolled = false;
    }
    this._cell.activate();

    this._panel = new BoxPanel();
    this._panel.direction = 'top-to-bottom';
    this._panel.spacing = 0;

    if (boxOptions?.showToolbar !== false) {
      this._panel.addWidget(toolbar);
    }
    this._panel.addWidget(this._cell);

    if (boxOptions?.showToolbar !== false) {
      BoxPanel.setStretch(toolbar, 0);
    }
    BoxPanel.setStretch(this._cell, 1);
    window.addEventListener('resize', () => {
      this._panel.update();
    });
    this._panel.update();
  }

  get panel(): BoxPanel {
    return this._panel;
  }

  get cell(): CodeCell | MarkdownCell | RawCell {
    return this._cell;
  }

  get sessionContext(): SessionContext {
    return this._sessionContext;
  }

  get kernel(): Kernel {
    return this._kernel;
  }

  execute = () => {
    if (this._type === 'code') {
      CodeCell.execute((this._cell as CodeCell), this._sessionContext);
    } else if (this._type === 'markdown') {
      (this._cell as MarkdownCell).rendered = true;
    }
  };
}

export namespace CellAdapter {
  export type ICellAdapterOptions = {
    type: 'code' | 'markdown' | 'raw';
    source: string;
    serverSettings: ServerConnection.ISettings;
    kernel: Kernel;
    boxOptions?: BoxOptions;
  };
}

export default CellAdapter;
