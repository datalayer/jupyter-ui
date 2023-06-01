import { BoxPanel, Widget } from '@lumino/widgets';
import { CommandRegistry } from '@lumino/commands';
import { SessionContext, Toolbar, ToolbarButton } from '@jupyterlab/apputils';
import { CodeCellModel, CodeCell, Cell } from '@jupyterlab/cells';
import { CodeMirrorMimeTypeService, EditorLanguageRegistry, CodeMirrorEditorFactory, EditorExtensionRegistry, EditorThemeRegistry, ybinding } from '@jupyterlab/codemirror';
import { runIcon } from '@jupyterlab/ui-components';
import { Completer, CompleterModel, CompletionHandler, ProviderReconciliator, KernelCompleterProvider } from '@jupyterlab/completer';
import { RenderMimeRegistry, standardRendererFactories as initialFactories } from '@jupyterlab/rendermime';
import { Session, ServerConnection, SessionManager, KernelManager, KernelSpecManager } from '@jupyterlab/services';
import { createStandaloneCell, YCodeCell, IYText } from '@jupyter/ydoc';
import { requireLoader } from "@jupyter-widgets/html-manager";
import { WIDGET_MIMETYPE, WidgetRenderer } from "@jupyter-widgets/html-manager/lib/output_renderers";
import { IPyWidgetsClassicManager } from "../../jupyter/ipywidgets/IPyWidgetsClassicManager";
import Kernel from './../../jupyter/services/kernel/Kernel';
import CellCommands from './CellCommands';

export class CellAdapter {
  private _panel: BoxPanel;
  private _codeCell: CodeCell;
  private _sessionContext: SessionContext;

  constructor(source: string, serverSettings: ServerConnection.ISettings, kernel?: Kernel, ) {
    const kernelManager = new KernelManager({
      serverSettings
    });
    const sessionManager = new SessionManager({
      serverSettings,
      kernelManager
    });
    const specsManager = new KernelSpecManager({
      serverSettings
    });
    const kernelPreference = kernel
    ? {
      id: kernel.id,
      shouldStart: true,
      autoStartDefault: false,
    } : {
      shouldStart: true,
      autoStartDefault: true,
      name: 'python',
    }
    this._sessionContext = new SessionContext({
      name: 'Jupyter React Cell',
      sessionManager,
      specsManager,
      kernelPreference
    });

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
    const iPyWidgetsClassicManager = new IPyWidgetsClassicManager({ loader: requireLoader });
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
      languages
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
        editorFactory: factoryService.newInlineEditor.bind(factoryService)
      }),
    });
    this._codeCell.addClass('dla-JupyterCell');
    this._codeCell.initializeState();
    this._sessionContext.kernelChanged.connect((sender: SessionContext, arg: Session.ISessionConnection.IKernelChangedArgs) => {
      const kernelConnection = arg.newValue;
      iPyWidgetsClassicManager.registerWithKernel(kernelConnection)
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

  execute = () => {
    CodeCell.execute(this._codeCell, this._sessionContext);
  }

}

export default CellAdapter;
