import { BoxPanel, Widget } from '@lumino/widgets';
import { find } from '@lumino/algorithm';
import { CommandRegistry } from '@lumino/commands';
import { SessionContext, ISessionContext, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCellModel, CodeCell, Cell } from '@jupyterlab/cells';
import { ybinding, CodeMirrorMimeTypeService, EditorLanguageRegistry, CodeMirrorEditorFactory, EditorExtensionRegistry, EditorThemeRegistry } from '@jupyterlab/codemirror';
import { Completer, CompleterModel, CompletionHandler, ProviderReconciliator, KernelCompleterProvider } from '@jupyterlab/completer';
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { Session, ServerConnection, SessionManager, KernelManager, KernelSpecManager } from '@jupyterlab/services';
import { runIcon } from '@jupyterlab/ui-components';
import { createStandaloneCell, YCodeCell, IYText } from '@jupyter/ydoc';
import { requireLoader as loader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import IPyWidgetsManager from "../../jupyter/ipywidgets/IPyWidgetsManager";
import Kernel from './../../jupyter/services/kernel/Kernel';
import CellCommands from './CellCommands';

export class CellAdapter {
  private _codeCell: CodeCell;
  private _kernel: Kernel;
  private _panel: BoxPanel;
  private _sessionContext: SessionContext;

  constructor(options: CellAdapter.ICellAdapterOptions) {
    const { source, serverSettings, kernel } = options;
    this._kernel = kernel;
    const kernelManager = kernel?.kernelManager ?? new KernelManager({
      serverSettings
    });
    const sessionManager = kernel?.sessionManager ?? new SessionManager({
      serverSettings,
      kernelManager
    });
    const specsManager = kernel?.kernelSpecManager ?? new KernelSpecManager({
      serverSettings
    });
    const kernelPreference: ISessionContext.IKernelPreference = kernel ?
      {
        id: kernel.id,
        shouldStart: false,
        autoStartDefault: false,
        shutdownOnDispose: false,
      }
    :
      {
        name: 'python',
        shouldStart: true,
        autoStartDefault: true,
        shutdownOnDispose: true,
      }

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
      const manager = (this._sessionContext as any).sessionManager as SessionManager;
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
              }
            });
            (this._sessionContext as any)._handleNewSession(session);
          }
          catch (err) {
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
              undoManager: sharedModel.undoManager ?? undefined,
            })
          );
        }
      });
      return registry;
    }  
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
          codeLanguages: (info: string) => languages.findBest(info) as any
        });
      }
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
    const rendermime = new RenderMimeRegistry({ initialFactories });
    const iPyWidgetsClassicManager = new IPyWidgetsManager({ loader });
    rendermime.addFactory(
      {
        safe: false,
        mimeTypes: [WIDGET_MIMETYPE],
        createRenderer: (options) => new WidgetRenderer(options, iPyWidgetsClassicManager),
      },
      0
    );
    const factoryService = new CodeMirrorEditorFactory({
      extensions: editorExtensions(),
      languages,
    });
    this._codeCell = new CodeCell({
      rendermime,
      model: new CodeCellModel({
        sharedModel: createStandaloneCell({
          cell_type: 'code',
          source: source,
          metadata: {
          }
        }) as YCodeCell
      }),
      contentFactory: new Cell.ContentFactory({
        editorFactory: factoryService.newInlineEditor.bind(factoryService),
      }),
    });
    this._codeCell.addClass('dla-JupyterCell');
    this._codeCell.initializeState();
    this._sessionContext.kernelChanged.connect((_, arg: Session.ISessionConnection.IKernelChangedArgs) => {
      const kernelConnection = arg.newValue;
      console.log('Current Kernel Connection', kernelConnection);
      if (kernelConnection && !kernelConnection.handleComms) {
        console.warn('The Kernel Connection does not handle Comms', kernelConnection.id);
        (kernelConnection as any).handleComms = true;
        console.log('The Kernel Connection is updated to enforce Comms support', kernelConnection.handleComms);
      }
      iPyWidgetsClassicManager.registerWithKernel(kernelConnection);
    });
    this._sessionContext.kernelChanged.connect(() => {
      void this._sessionContext.session?.kernel?.info.then(info => {
        const lang = info.language_info;
        const mimeType = mimeService.getMimeTypeByLanguage(lang);
        this._codeCell.model.mimeType = mimeType;
      });
    });
    const editor = this._codeCell.editor;
    const model = new CompleterModel();
    const completer = new Completer({ editor, model });
    const timeout = 1000;
    const provider = new KernelCompleterProvider();
    const reconciliator = new ProviderReconciliator({
      context: { widget: this._codeCell, editor, session: this._sessionContext.session },
      providers: [provider],
      timeout,
    });
    const handler = new CompletionHandler({ completer, reconciliator });
    void this._sessionContext.ready.then(() => {
      const provider = new KernelCompleterProvider();
      handler.reconciliator = new ProviderReconciliator({
        context: { widget: this._codeCell, editor, session: this._sessionContext.session },
        providers: [provider],
        timeout,
      });
    });
    handler.editor = editor;
    CellCommands(commands, this._codeCell!, this._sessionContext, handler);  
    completer.hide();
    completer.addClass('jp-Completer-Cell');
    Widget.attach(completer, document.body);
    const toolbar = new Toolbar();
    toolbar.addItem('spacer', Toolbar.createSpacerItem());
    const runButton = new ToolbarButton({
      icon: runIcon,
      onClick: () => {
        CodeCell.execute(this._codeCell, this._sessionContext);
      },
      tooltip: 'Run'
    });
    toolbar.addItem('run', runButton);
    toolbar.addItem('interrupt', Toolbar.createInterruptButton(this._sessionContext));
    toolbar.addItem('restart', Toolbar.createRestartButton(this._sessionContext));
    // toolbar.addItem('name', Toolbar.createKernelNameItem(this._sessionContext));
    toolbar.addItem('status', Toolbar.createKernelStatusItem(this._sessionContext));

    this._codeCell.outputsScrolled = false;
    this._codeCell.activate();

    this._panel = new BoxPanel();
    this._panel.direction = 'top-to-bottom';
    this._panel.spacing = 0;
    this._panel.addWidget(toolbar);
    this._panel.addWidget(this._codeCell);
    BoxPanel.setStretch(toolbar, 0);
    BoxPanel.setStretch(this._codeCell, 1);
    window.addEventListener('resize', () => {
      this._panel.update();
    });
    this._panel.update();
  }

  get panel(): BoxPanel {
    return this._panel;
  }

  get codeCell(): CodeCell {
    return this._codeCell;
  }

  get sessionContext(): SessionContext {
    return this._sessionContext;
  }

  get kernel(): Kernel {
    return this._kernel;
  }

  execute = () => {
    CodeCell.execute(this._codeCell, this._sessionContext);
  }

}

export namespace CellAdapter {

  export type ICellAdapterOptions = {
    source: string;
    serverSettings: ServerConnection.ISettings;
    kernel: Kernel;
  }
}

export default CellAdapter;
